import { Link } from 'react-router-dom'
import { CalendarCheck2, CalendarDays, BookOpen, NotebookPen, Radio, UserCog, Wrench } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useHomeWelcomeSettings } from '@/components/HomeWelcome'
import { StudentDashboard } from '@/components/StudentDashboard'

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
  const firstName = profile?.full_name?.split(' ')[0] ?? ''
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

      <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-surface p-6">
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
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 60%)',
            }}
          />
        )}
        <div className="relative flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <Avatar className="size-14 shrink-0 border border-primary/40">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold leading-snug text-fg sm:text-2xl">
                {firstName}, sê muito bem-vindo(a) à Mentoria{' '}
                <span className="text-primary">{welcome?.mentoriaName}</span>!
              </h1>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                {welcome?.body}
              </p>
            </div>
          </div>

          {(profile?.start_date || profile?.end_date) && (
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:gap-8">
              {profile?.start_date && (
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                      Início da mentoria
                    </p>
                    <p className="text-sm text-fg">{formatDate(profile.start_date)}</p>
                  </div>
                </div>
              )}
              {profile?.end_date && (
                <div className="flex items-start gap-2">
                  <CalendarCheck2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                      Fim previsto
                    </p>
                    <p className="text-sm text-fg">{formatDate(profile.end_date)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {welcome?.mentorNote && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3">
              <NotebookPen className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Nota da tua mentora
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-fg">{welcome.mentorNote}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {profile && <StudentDashboard studentId={profile.id} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map(({ to, icon: Icon, label, description }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/50"
          >
            <Icon className="size-5 text-primary" />
            <p className="text-sm font-medium text-fg">{label}</p>
            <p className="text-xs text-fg-muted">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
