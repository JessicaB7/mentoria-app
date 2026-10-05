import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck2, CalendarDays, BookOpen, NotebookPen, Radio, UserCog, Wrench } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useHomeWelcomeSettings } from '@/components/HomeWelcome'
import { StudentDashboard } from '@/components/StudentDashboard'
import { HomeLiveCalendar } from '@/components/LiveCalendarCard'

const QUICK_LINKS = [
  {
    to: '/aluno/ao-vivo',
    icon: Radio,
    label: 'Aula ao vivo',
    description: 'Hot Seats e as próximas sessões em grupo.',
  },
  {
    to: '/aluno/gravado',
    icon: BookOpen,
    label: 'Conteúdo gravado',
    description: 'O currículo completo, ao teu ritmo.',
  },
  {
    to: '/aluno/individual',
    icon: UserCog,
    label: 'Acompanhamento individual',
    description: 'As tuas sessões 1:1 e o teu plano de ação.',
  },
  {
    to: '/aluno/ferramentas',
    icon: Wrench,
    label: 'Ferramentas',
    description: 'Templates e ferramentas prontos a usar.',
  },
]

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Semana atual da mentoria, entre a data de início e o fim previsto
function journeyProgress(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return null
  const startMs = new Date(`${start}T00:00:00`).getTime()
  const endMs = new Date(`${end}T00:00:00`).getTime()
  const week = 7 * 24 * 60 * 60 * 1000
  if (endMs <= startMs) return null
  const totalWeeks = Math.max(1, Math.ceil((endMs - startMs) / week))
  const elapsed = Math.min(Math.max(Date.now() - startMs, 0), endMs - startMs)
  return {
    week: Math.min(totalWeeks, Math.floor(elapsed / week) + 1),
    totalWeeks,
    percent: Math.round((elapsed / (endMs - startMs)) * 100),
  }
}

export function StudentHome() {
  const { profile } = useAuth()
  const { data: welcome } = useHomeWelcomeSettings()
  const initials = profile?.full_name?.slice(0, 2).toUpperCase() ?? '??'
  // Algumas contas têm o email como nome — nesse caso cumprimenta sem nome
  const fullName = profile?.full_name?.includes('@') ? '' : (profile?.full_name ?? '')
  const firstName = fullName.split(' ')[0]
  const journey = journeyProgress(profile?.start_date, profile?.end_date)

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-xl border border-primary/40 bg-[#121212]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 140% at 100% 50%, rgba(201, 169, 97, 0.22), transparent 70%), radial-gradient(40% 120% at 0% 100%, rgba(201, 169, 97, 0.10), transparent 70%)',
          }}
        />
        <div className="relative flex items-center justify-between gap-6 px-2 sm:px-4">
          <img
            src="/mentoria-banner.png"
            alt="Mentoria Contabilista Explica"
            className="h-24 w-auto max-w-full object-contain mix-blend-lighten sm:h-32"
          />
          {journey && (
            <div className="hidden shrink-0 flex-col items-end gap-2 border-l border-[#c9a961]/30 pl-6 md:flex">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#c9a961]">A tua jornada</p>
              <p className="text-2xl font-light text-white">
                Semana <span className="font-semibold text-[#e4cc8f]">{journey.week}</span>
                <span className="text-white/50"> de {journey.totalWeeks}</span>
              </p>
              <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8a6a17] to-[#e4cc8f]"
                  style={{ width: `${journey.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-[#c9a961]/70 to-transparent" />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-surface shadow-sm">
        {welcome?.coverUrl ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${welcome.coverUrl})` }}
            />
            <div className="pointer-events-none absolute inset-0 bg-surface/85" />
          </>
        ) : (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 120% at 100% 0%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 65%)',
            }}
          />
        )}
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#e4cc8f] via-primary to-[#e4cc8f]" />
        <div className="relative flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex items-start gap-5">
            <div className="shrink-0 rounded-full bg-gradient-to-br from-[#e4cc8f] via-primary to-[#5c470f] p-0.5 shadow-md">
              <Avatar className="size-16 border-2 border-surface">
                <AvatarFallback className="bg-[#121212] font-display text-xl font-semibold text-[#e4cc8f]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
                Mentoria {welcome?.mentoriaName}
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-fg sm:text-4xl">
                {firstName ? `Olá, ${firstName}!` : 'Olá!'} <span className="text-primary">Bem-vindo(a).</span>
              </h1>
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                {welcome?.body}
              </p>
            </div>
          </div>

          {(profile?.start_date || profile?.end_date) && (
            <div className="flex flex-wrap gap-2">
              {profile?.start_date && (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs text-fg">
                  <CalendarDays className="size-3.5 text-primary" />
                  <span className="text-fg-muted">Início</span>
                  {formatDate(profile.start_date)}
                </span>
              )}
              {profile?.end_date && (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs text-fg">
                  <CalendarCheck2 className="size-3.5 text-primary" />
                  <span className="text-fg-muted">Fim previsto</span>
                  {formatDate(profile.end_date)}
                </span>
              )}
            </div>
          )}

          {welcome?.mentorNote && (
            <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
              <NotebookPen className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">Nota da tua mentora</p>
                <p className="mt-1 whitespace-pre-wrap font-display text-lg italic leading-snug text-fg">
                  {welcome.mentorNote}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {profile && <StudentDashboard studentId={profile.id} />}

      <HomeLiveCalendar />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map(({ to, icon: Icon, label, description }) => (
          <Link
            key={to}
            to={to}
            className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#121212] text-[#e4cc8f] shadow-sm">
              <Icon className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-1 text-sm font-semibold text-fg">
                {label}
                <ArrowRight className="size-3.5 -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </p>
              <p className="text-xs leading-relaxed text-fg-muted">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
