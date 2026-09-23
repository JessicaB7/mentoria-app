import { useQuery } from '@tanstack/react-query'
import { PlayCircle, Video } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import type { SessionRecording } from '@/types/database'

type RecordingWithLesson = SessionRecording & {
  lessons: { title: string; session_date: string | null }
}

function youtubeThumbnail(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null
}

// Data da gravação; se não tiver, usa a data da aula e, em último caso, a data em que foi adicionada.
function recordingDate(recording: RecordingWithLesson) {
  const dateStr = recording.session_date ?? recording.lessons.session_date
  return dateStr ? new Date(`${dateStr}T00:00:00`) : new Date(recording.created_at)
}

export function LiveRecordingsGallery() {
  const { data: recordings, isLoading } = useQuery({
    queryKey: ['live-recordings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_recordings')
        .select('*, lessons!inner(title, session_date, category)')
        .eq('lessons.category', 'ao_vivo')
      if (error) throw error
      return (data as unknown as RecordingWithLesson[]).sort(
        (a, b) => recordingDate(b).getTime() - recordingDate(a).getTime(),
      )
    },
  })

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-fg">Gravações das sessões</h2>
        <p className="text-sm text-fg-muted">Revê as sessões ao vivo que já aconteceram.</p>
      </div>

      {isLoading || !recordings ? (
        <div className="flex h-24 items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : recordings.length === 0 ? (
        <Card className="flex items-center gap-3 px-4 py-6 text-sm text-fg-muted">
          <Video className="size-5 shrink-0" />
          Ainda não há gravações. Assim que uma sessão for gravada, aparece aqui.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recordings.map((recording) => {
            const date = recordingDate(recording)
            const thumbnail = youtubeThumbnail(recording.url)
            return (
              <a
                key={recording.id}
                href={recording.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition hover:border-primary/50 hover:shadow-md"
              >
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
                      <span className="text-4xl font-semibold leading-none">
                        {date.toLocaleDateString('pt-PT', { day: '2-digit' })}
                      </span>
                      <span className="mt-1 text-sm font-medium uppercase tracking-wide">
                        {date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-fg/0 transition group-hover:bg-fg/20">
                    <PlayCircle className="size-10 text-primary-foreground opacity-0 drop-shadow transition group-hover:opacity-100" />
                  </div>
                  <span className="absolute left-2 top-2 rounded-md bg-surface/90 px-2 py-0.5 text-xs font-medium text-fg shadow-sm">
                    {date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-fg">{recording.title}</p>
                  <p className="truncate text-xs text-fg-muted">{recording.lessons.title}</p>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </section>
  )
}
