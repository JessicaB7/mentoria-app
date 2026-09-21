import * as React from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarCheck2, CalendarDays, BookOpen, NotebookPen, Radio, UserCog } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const { profile, refreshProfile } = useAuth()
  const { data: welcome } = useHomeWelcomeSettings()
  const [fullName, setFullName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
  }, [profile])

  const dirty = profile != null && (fullName !== profile.full_name || phone !== (profile.phone ?? ''))
  const initials = profile?.full_name?.slice(0, 2).toUpperCase() ?? '??'
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  async function handleSave() {
    if (!profile || !fullName.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', profile.id)
    setSaving(false)
    if (error) {
      toast.error('Não foi possível guardar os teus dados.')
      return
    }
    await refreshProfile()
    toast.success('Dados atualizados.')
  }

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

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Os teus dados</CardTitle>
          <CardDescription>Mantém o teu nome e contacto atualizados.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-name">Nome completo</Label>
            <Input id="student-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-phone">Telefone</Label>
            <Input
              id="student-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="912 345 678"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-email">Email</Label>
            <Input id="student-email" value={profile?.email ?? ''} disabled />
          </div>
          <Button onClick={handleSave} disabled={!dirty || saving || !fullName.trim()} className="w-fit">
            Guardar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
