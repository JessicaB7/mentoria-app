import { CalendarClock } from 'lucide-react'
import type { Lesson } from '@/types/database'

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateStr}T00:00:00`)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function NextLiveSessionBanner({ lessons }: { lessons: Lesson[] }) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const upcoming = lessons
    .filter((l): l is Lesson & { session_date: string } => !!l.session_date && l.session_date >= todayStr)
    .sort((a, b) => (a.session_date < b.session_date ? -1 : 1))[0]

  if (!upcoming) return null

  const d = daysUntil(upcoming.session_date)
  const when = d === 0 ? 'hoje' : d === 1 ? 'amanhã' : `em ${d} dias`
  const formatted = new Date(`${upcoming.session_date}T00:00:00`).toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <CalendarClock className="size-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Próxima sessão</p>
        <p className="truncate text-sm text-fg">
          {upcoming.title} · {formatted}
          {upcoming.duration_minutes && ` · ${upcoming.duration_minutes} min`} · {when}
        </p>
      </div>
    </div>
  )
}
