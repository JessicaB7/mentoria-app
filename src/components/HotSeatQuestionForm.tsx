import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import type { HotSeatQuestion } from '@/types/database'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function HotSeatQuestionForm({ studentId }: { studentId: string }) {
  const queryClient = useQueryClient()
  const [question, setQuestion] = React.useState('')
  const [context, setContext] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const queryKey = ['hot-seat-questions', studentId]

  const { data: questions, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hot_seat_questions')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as HotSeatQuestion[]
    },
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setSaving(true)
    const { error } = await supabase.from('hot_seat_questions').insert({
      student_id: studentId,
      question: question.trim(),
      context: context.trim() || null,
    })
    setSaving(false)
    if (error) {
      toast.error('Não foi possível enviar a dúvida.')
      return
    }
    toast.success('Dúvida enviada! Vai ser respondida num próximo Hot Seat.')
    setQuestion('')
    setContext('')
    queryClient.invalidateQueries({ queryKey })
  }

  async function remove(item: HotSeatQuestion) {
    if (!confirm('Apagar esta dúvida?')) return
    const { error } = await supabase.from('hot_seat_questions').delete().eq('id', item.id)
    if (error) {
      toast.error('Não foi possível apagar a dúvida.')
      return
    }
    queryClient.invalidateQueries({ queryKey })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Envia a tua dúvida</CardTitle>
          <CardDescription>
            Escreve a dúvida que queres ver respondida no próximo Hot Seat. Quanto mais contexto deres, melhor a
            resposta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hs-question">A tua dúvida *</Label>
              <Textarea
                id="hs-question"
                placeholder="Ex.: Como devo apresentar o preço da avença a um cliente novo?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hs-context">Contexto (opcional)</Label>
              <Textarea
                id="hs-context"
                placeholder="Situação, o que já tentaste, números relevantes…"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!question.trim() || saving} className="w-fit">
              Enviar dúvida
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-fg">As minhas dúvidas</h2>
        {isLoading ? (
          <Spinner className="size-5" />
        ) : !questions?.length ? (
          <p className="text-sm text-fg-muted">Ainda não enviaste nenhuma dúvida.</p>
        ) : (
          questions.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              {item.answered ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <Clock className="mt-0.5 size-4 shrink-0 text-fg-muted" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="whitespace-pre-wrap text-sm text-fg">{item.question}</p>
                {item.context && <p className="whitespace-pre-wrap text-xs text-fg-muted">{item.context}</p>}
                <p className="text-xs text-fg-muted">
                  {formatDate(item.created_at)} · {item.answered ? 'Respondida' : 'Por responder'}
                </p>
              </div>
              {!item.answered && (
                <button
                  type="button"
                  onClick={() => remove(item)}
                  className="text-fg-muted hover:text-fg"
                  aria-label="Apagar dúvida"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
