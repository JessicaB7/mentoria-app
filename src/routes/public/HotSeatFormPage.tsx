import * as React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Página pública (sem login) para os alunos deixarem dúvidas para o próximo Hot Seat.
export function HotSeatFormPage() {
  const { profile } = useAuth()
  const [name, setName] = React.useState('')
  const [priority, setPriority] = React.useState('')
  const [question, setQuestion] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  const isStudent = profile?.role === 'student'
  const canSubmit = !!name.trim() && !!priority.trim() && !!question.trim() && !saving

  React.useEffect(() => {
    if (isStudent && profile?.full_name) setName((current) => current || profile.full_name)
  }, [isStudent, profile?.full_name])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSaving(true)
    const { error } = await supabase.from('hot_seat_questions').insert({
      student_name: name.trim(),
      priority: priority.trim(),
      question: question.trim(),
      notes: notes.trim() || null,
      student_id: isStudent ? profile.id : null,
    })
    setSaving(false)
    if (error) {
      setError('Não foi possível enviar. Tenta novamente daqui a pouco.')
      return
    }
    setSent(true)
  }

  function sendAnother() {
    setPriority('')
    setQuestion('')
    setNotes('')
    setSent(false)
  }

  return (
    <div
      className="flex min-h-svh justify-center bg-background px-4 py-10 sm:py-16"
      style={{
        backgroundImage:
          'radial-gradient(60% 50% at 85% 10%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent)',
      }}
    >
      <div className="flex w-full max-w-xl flex-col gap-4">
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#e4cc8f] via-primary to-[#e4cc8f]" />
          <CardHeader>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Mentoria Contabilistas
            </p>
            <CardTitle className="font-display text-2xl">Hot Seat</CardTitle>
            <CardDescription>
              Conta-nos a tua prioridade deste mês e deixa as dúvidas que queres ver respondidas no próximo Hot Seat.
            </CardDescription>
          </CardHeader>
        </Card>

        {sent ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 pt-6">
              <div className="flex items-center gap-2 text-fg">
                <CheckCircle2 className="size-5 text-primary" />
                <p className="font-semibold">Dúvida enviada!</p>
              </div>
              <p className="text-sm text-fg-muted">Obrigada, {name.trim().split(' ')[0]}. Vamos responder no próximo Hot Seat.</p>
              <Button variant="outline" onClick={sendAnother}>
                Enviar outra dúvida
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Card>
              <CardContent className="flex flex-col gap-2 pt-6">
                <Label htmlFor="hs-name">
                  Nome <span className="text-danger">*</span>
                </Label>
                <Input
                  id="hs-name"
                  autoComplete="name"
                  placeholder="O teu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-2 pt-6">
                <Label htmlFor="hs-priority">
                  Qual é a tua principal prioridade este mês? <span className="text-danger">*</span>
                </Label>
                <Textarea
                  id="hs-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  rows={3}
                  required
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-2 pt-6">
                <Label htmlFor="hs-question">
                  Quais são as tuas dúvidas? <span className="text-danger">*</span>
                </Label>
                <p className="text-xs text-fg-muted">
                  Dá um breve contexto e faz perguntas diretas e específicas.
                </p>
                <Textarea
                  id="hs-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={6}
                  required
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-2 pt-6">
                <Label htmlFor="hs-notes">Informações importantes que tenhamos de ter em conta</Label>
                <p className="text-xs text-fg-muted">Contexto, números, links ou qualquer detalhe que ajude a responder.</p>
                <Textarea id="hs-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
              </CardContent>
            </Card>

            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={!canSubmit} className="w-fit">
              {saving ? 'A enviar…' : 'Enviar'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
