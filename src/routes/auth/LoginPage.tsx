import * as React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function LoginPage() {
  const { session, profile, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [resetSent, setResetSent] = React.useState(false)
  const [resetting, setResetting] = React.useState(false)

  if (!loading && session && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/aluno'} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError('Email ou palavra-passe inválidos.')
      return
    }
    navigate('/', { replace: true })
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Escreve o teu email em cima e depois clica em "Esqueceste-te da password?".')
      return
    }
    setError(null)
    setResetting(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetting(false)
    setResetSent(true)
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar na Mentoria Contabilistas</CardTitle>
          <CardDescription>Acede às tuas aulas e materiais.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Palavra-passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={submitting} className="mt-2">
              {submitting ? 'A entrar…' : 'Entrar'}
            </Button>
          </form>

          {resetSent ? (
            <p className="mt-4 text-sm text-success">
              Enviámos um email para {email} com um link para definires uma nova password.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetting}
              className="mt-4 text-sm text-fg-muted underline hover:text-fg"
            >
              {resetting ? 'A enviar…' : 'Esqueceste-te da password?'}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
