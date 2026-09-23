import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PlayCircle, Video } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SESSION_TYPE_LABELS } from '@/lib/sessionType'
import type { Lesson, SessionRecording } from '@/types/database'

function youtubeThumbnail(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null
}

// Mais recentes primeiro; aulas sem data ficam no fim.
function byDateDesc(a: Lesson, b: Lesson) {
  if (a.session_date === b.session_date) return a.position - b.position
  if (!a.session_date) return 1
  if (!b.session_date) return -1
  return a.session_date < b.session_date ? 1 : -1
}

// Um cartão por aula ao vivo. No aluno abre a página da aula (linkBase); no admin abre a edição (onSelect).
export function LiveRecordingsGallery({
  lessons,
  linkBase,
  onSelect,
}: {
  lessons: Lesson[]
  linkBase?: string
  onSelect?: (lesson: Lesson) => void
}) {
  const lessonIds = lessons.map((l) => l.id)
  const { data: recordings } = useQuery({
    queryKey: ['live-recordings', lessonIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_recordings')
        .select('lesson_id, url')
        .in('lesson_id', lessonIds)
        .order('position', { ascending: true })
      if (error) throw error
      return data as Pick<SessionRecording, 'lesson_id' | 'url'>[]
    },
    enabled: lessonIds.length > 0,
  })

  if (lessons.length === 0) {
    return (
      <Card className="flex items-center gap-3 px-4 py-6 text-sm text-fg-muted">
        <Video className="size-5 shrink-0" />
        Ainda não há sessões ao vivo.
      </Card>
    )
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...lessons].sort(byDateDesc).map((lesson) => {
        const lessonRecordings = (recordings ?? []).filter((r) => r.lesson_id === lesson.id)
        const thumbnail = lessonRecordings.map((r) => youtubeThumbnail(r.url)).find(Boolean)
        const date = lesson.session_date ? new Date(`${lesson.session_date}T00:00:00`) : null
        const upcoming = !!lesson.session_date && lesson.session_date > todayStr
        const className =
          'group overflow-hidden rounded-lg border border-border bg-surface text-left shadow-sm transition hover:border-primary/50 hover:shadow-md'

        const content = (
          <>
            <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/25 via-primary/10 to-background">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center text-primary">
                  {date ? (
                    <>
                      <span className="text-4xl font-semibold leading-none">
                        {date.toLocaleDateString('pt-PT', { day: '2-digit' })}
                      </span>
                      <span className="mt-1 text-sm font-medium uppercase tracking-wide">
                        {date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                      </span>
                    </>
                  ) : (
                    <Video className="size-10" />
                  )}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-fg/0 transition group-hover:bg-fg/20">
                <PlayCircle className="size-10 text-primary-foreground opacity-0 drop-shadow transition group-hover:opacity-100" />
              </div>
              {date && (
                <span className="absolute left-2 top-2 rounded-md bg-surface/90 px-2 py-0.5 text-xs font-medium text-fg shadow-sm">
                  {date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
              {upcoming && (
                <span className="absolute right-2 top-2 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
                  Brevemente
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-fg">{lesson.title}</p>
                {lesson.session_type && <Badge>{SESSION_TYPE_LABELS[lesson.session_type]}</Badge>}
              </div>
              <p className="text-xs text-fg-muted">
                {lessonRecordings.length === 0
                  ? upcoming
                    ? 'Gravação disponível após a sessão'
                    : lesson.video_path
                      ? 'Gravação disponível'
                      : 'Sem gravação ainda'
                  : lessonRecordings.length === 1
                    ? '1 gravação'
                    : `${lessonRecordings.length} gravações`}
                {lesson.duration_minutes && ` · ${lesson.duration_minutes} min`}
              </p>
            </div>
          </>
        )

        return onSelect ? (
          <button key={lesson.id} type="button" onClick={() => onSelect(lesson)} className={className}>
            {content}
          </button>
        ) : (
          <Link key={lesson.id} to={`${linkBase ?? '/aluno/aulas'}/${lesson.id}`} className={className}>
            {content}
          </Link>
        )
      })}
    </div>
  )
}
