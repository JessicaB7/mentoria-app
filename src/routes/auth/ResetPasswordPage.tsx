import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [ready, setReady] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [done, setDone] = React.useState(false)

  React.useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

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
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) {
      setError('Não foi possível definir a nova password. Pede um novo link de recuperação.')
      return
    }
    setDone(true)
    setTimeout(() => navigate('/', { replace: true }), 1500)
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Definir nova password</CardTitle>
          <CardDescription>Escreve a tua nova password de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              <Spinner /> A validar o link…
            </div>
          ) : done ? (
            <p className="text-sm text-success">Password definida. A entrar…</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Nova password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password">Confirmar password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" disabled={submitting} className="mt-2">
                {submitting ? 'A guardar…' : 'Guardar nova password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
