import { useQuery } from '@tanstack/react-query'
import { CalendarDays, PlayCircle, Video } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { renderRichText } from '@/lib/richText'
import { findLiveSections } from '@/lib/liveSections'
import { LiveCalendarCard } from '@/components/LiveCalendarCard'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { Lesson, SessionRecording } from '@/types/database'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function StudentLiveLessons() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-live-page'],
    queryFn: async () => {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('category', 'ao_vivo')
        .eq('published', true)
        .order('position', { ascending: true })
      if (error) throw error
      const sections = findLiveSections((lessons ?? []) as Lesson[])

      let recordings: SessionRecording[] = []
      if (sections.recordings) {
        const { data: rows, error: recError } = await supabase
          .from('session_recordings')
          .select('*')
          .eq('lesson_id', sections.recordings.id)
          .order('position', { ascending: true })
        if (recError) throw recError
        // A política RLS já esconde as ocultas; o filtro cobre a pré-visualização do admin
        recordings = ((rows ?? []) as SessionRecording[]).filter((r) => r.visible !== false)
      }
      return { intro: sections.intro, recordingsLesson: sections.recordings, calendar: sections.calendar, recordings }
    },
  })

  if (isLoading || !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  const { intro, recordingsLesson, calendar, recordings } = data

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-surface shadow-sm">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#e4cc8f] via-primary to-[#e4cc8f]" />
        <div className="flex flex-col gap-3 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">Aula ao vivo</p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-fg sm:text-4xl">
            {intro?.title ?? 'Hot Seats'}
          </h1>
          {intro?.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
              {renderRichText(intro.description)}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="calendario">
        <TabsList>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
          <TabsTrigger value="gravacoes">Gravações</TabsTrigger>
        </TabsList>

        <TabsContent value="calendario">
          {calendar?.description ? (
            <LiveCalendarCard lesson={calendar} />
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-6 text-sm text-fg-muted">
              <CalendarDays className="size-5 shrink-0 text-primary" />
              As próximas datas vão ser anunciadas em breve.
            </div>
          )}
        </TabsContent>

        <TabsContent value="gravacoes" className="flex flex-col gap-4">
          {recordingsLesson?.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
              {renderRichText(recordingsLesson.description)}
            </p>
          )}
          {recordings.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-6 text-sm text-fg-muted">
              <Video className="size-5 shrink-0 text-primary" />
              Ainda não há gravações. Aparecem aqui depois de cada sessão.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recordings.map((recording) => (
                <a
                  key={recording.id}
                  href={recording.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                >
                  <div className="relative flex aspect-video items-center justify-center bg-[#121212]">
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: 'radial-gradient(70% 120% at 100% 0%, rgba(201, 169, 97, 0.25), transparent 70%)',
                      }}
                    />
                    <div className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#e4cc8f] to-primary text-[#121212] shadow-md transition-transform group-hover:scale-110">
                      <PlayCircle className="size-7" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-fg">{recording.title}</p>
                    <p className="text-xs text-fg-muted">
                      {recording.session_date ? formatDate(recording.session_date) : 'Ver gravação'}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  )
}
