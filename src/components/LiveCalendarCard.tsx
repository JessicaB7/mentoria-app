import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { renderRichText } from '@/lib/richText'
import { findLiveSections } from '@/lib/liveSections'
import type { Lesson } from '@/types/database'

// Cartão escuro com o texto da aula "Calendário das sessões ao vivo".
// Na página Início vai buscar a aula sozinho e liga para a página Aula ao vivo.
export function LiveCalendarCard({ lesson, showLink = false }: { lesson: Lesson; showLink?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-[#121212] shadow-sm">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 140% at 100% 0%, rgba(201, 169, 97, 0.22), transparent 70%)' }}
      />
      <div className="relative flex items-start gap-4 p-6 sm:p-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#e4cc8f] to-primary text-[#121212] shadow-md">
          <CalendarDays className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c9a961]">{lesson.title}</p>
            {showLink && (
              <Link
                to="/aluno/ao-vivo"
                className="hidden shrink-0 items-center gap-1 rounded-full border border-[#c9a961]/40 px-3 py-1.5 text-xs font-medium text-[#e4cc8f] transition-colors hover:bg-[#c9a961]/15 sm:inline-flex"
              >
                Aula ao vivo
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/85 [&_strong]:text-[#e4cc8f]">
            {renderRichText(lesson.description ?? '')}
          </p>
        </div>
      </div>
    </div>
  )
}

export function HomeLiveCalendar() {
  const { data: calendar } = useQuery({
    queryKey: ['live-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('category', 'ao_vivo')
        .eq('published', true)
      if (error) throw error
      return findLiveSections((data ?? []) as Lesson[]).calendar
    },
  })

  if (!calendar?.description) return null
  return <LiveCalendarCard lesson={calendar} showLink />
}
