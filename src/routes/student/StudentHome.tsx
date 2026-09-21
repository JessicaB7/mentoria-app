import { Link } from 'react-router-dom'
import { CalendarCheck2, CalendarDays, BookOpen, NotebookPen, Radio, UserCog } from 'lucide-react'
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
]

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function StudentHome() {
  const { profile } = useAuth()
  const { data: welcome } = useHomeWelcomeSettings()
  const initials = profile?.full_name?.slice(0, 2).toUpperCase() ?? '??'
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <div className="flex flex-col gap-6">
      <img
        src="/mentoria-banner.png"
        alt="Mentoria Contabilista Explica"
        className="w-full rounded-xl border border-primary/30 object-cover"
      />

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
