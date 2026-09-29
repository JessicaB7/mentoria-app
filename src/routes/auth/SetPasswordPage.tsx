import * as React from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// Primeiro acesso do aluno: troca a password gerada por uma escolhida por si.
// Ao guardar, o onAuthStateChange traz a sessão com password_set e o ProtectedRoute deixa passar.
export function SetPasswordPage() {
  const { profile, signOut } = useAuth()
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As passwords não coincidem.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password, data: { password_set: true } })
    setSubmitting(false)
    if (error) {
      setError(
        error.message.toLowerCase().includes('different')
          ? 'Escolhe uma password diferente da que recebeste.'
          : 'Não foi possível guardar a password. Tenta novamente.',
      )
    }
  }

  return (
    <div
      className="flex min-h-svh items-center justify-center bg-background px-4"
      style={{
        backgroundImage:
          'radial-gradient(60% 50% at 85% 10%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent)',
      }}
    >
      <Card className="w-full max-w-sm">
        <CardHeader>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Mentoria Contabilistas
          </p>
          <CardTitle>{firstName ? `Bem-vinda, ${firstName}!` : 'Bem-vinda!'}</CardTitle>
          <CardDescription>
            Antes de começar, define a tua password. É esta que vais usar a partir de agora para entrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">Nova password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-new-password">Confirmar password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={submitting} className="mt-2">
              {submitting ? 'A guardar…' : 'Guardar e entrar'}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-4 w-full text-center text-xs text-fg-muted hover:text-fg"
          >
            Sair
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
