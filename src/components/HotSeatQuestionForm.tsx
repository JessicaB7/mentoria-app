import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { findUpcomingLiveSessions, formatSessionDate } from '@/lib/liveSections'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { HotSeatQuestion } from '@/types/database'

const HOT_SEAT_TOPICS = [
  'Preços e serviços',
  'Captar clientes',
  'Vendas e propostas',
  'Gestão de clientes',
  'Marketing e redes sociais',
  'Organização e processos',
  'Equipa e delegação',
  'Questão técnica / fiscal',
  'Outro',
] as const

const OTHER = 'Outro'
const NO_SESSION = 'proxima'

function toIsoDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function HotSeatAnswers({ item }: { item: HotSeatQuestion }) {
  const rows: [string, string | null][] = [
    ['Situação', item.situation],
    ['O que já tentou', item.tried],
    ['O que quer saber', item.goal],
  ]
  return (
    <div className="flex flex-col gap-2">
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-medium text-fg-muted">{label}</p>
            <p className="whitespace-pre-wrap text-sm text-fg">{value}</p>
          </div>
        ))}
    </div>
  )
}

export function HotSeatQuestionForm({ studentId, calendarText }: { studentId: string; calendarText: string | null }) {
  const queryClient = useQueryClient()
  const [topic, setTopic] = React.useState('')
  const [otherTopic, setOtherTopic] = React.useState('')
  const [situation, setSituation] = React.useState('')
  const [tried, setTried] = React.useState('')
  const [goal, setGoal] = React.useState('')
  const [session, setSession] = React.useState(NO_SESSION)
  const [saving, setSaving] = React.useState(false)
  const queryKey = ['hot-seat-questions', studentId]

  const sessions = React.useMemo(() => {
    const seen = new Set<string>()
    return findUpcomingLiveSessions(calendarText ?? '')
      .map((s) => ({ value: toIsoDate(s.date), label: s.label }))
      .filter((s) => (seen.has(s.value) ? false : (seen.add(s.value), true)))
  }, [calendarText])

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

  const finalTopic = topic === OTHER ? otherTopic.trim() || OTHER : topic
  const canSubmit = !!topic && !!situation.trim() && !!goal.trim() && !saving

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    const { error } = await supabase.from('hot_seat_questions').insert({
      student_id: studentId,
      topic: finalTopic,
      situation: situation.trim(),
      tried: tried.trim() || null,
      goal: goal.trim(),
      session_date: session === NO_SESSION ? null : session,
    })
    setSaving(false)
    if (error) {
      toast.error('Não foi possível enviar a dúvida.')
      return
    }
    toast.success('Dúvida enviada! Vai ser respondida no Hot Seat.')
    setTopic('')
    setOtherTopic('')
    setSituation('')
    setTried('')
    setGoal('')
    setSession(NO_SESSION)
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
          <CardTitle className="text-base">Envia a tua dúvida para o Hot Seat</CardTitle>
          <CardDescription>
            Preenche as perguntas abaixo para chegarmos à sessão já com o teu caso preparado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label>Tema da dúvida *</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolhe um tema" />
                </SelectTrigger>
                <SelectContent>
                  {HOT_SEAT_TOPICS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {topic === OTHER && (
                <Input
                  placeholder="Qual é o tema?"
                  value={otherTopic}
                  onChange={(e) => setOtherTopic(e.target.value)}
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hs-situation">Descreve a situação concreta *</Label>
              <Textarea
                id="hs-situation"
                placeholder="O que está a acontecer? Dá exemplos, números e o contexto do teu negócio."
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hs-tried">O que já tentaste?</Label>
              <Textarea
                id="hs-tried"
                placeholder="O que já fizeste para resolver e qual foi o resultado."
                value={tried}
                onChange={(e) => setTried(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hs-goal">O que queres sair do Hot Seat a saber? *</Label>
              <Textarea
                id="hs-goal"
                placeholder="Ex.: Que preço devo propor e como o apresento ao cliente."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Para que sessão?</Label>
              <Select value={session} onValueChange={setSession}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SESSION}>A próxima disponível</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {formatSessionDate(s.value)}
                      {s.label ? ` — ${s.label}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={!canSubmit} className="w-fit">
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
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-sm font-semibold text-fg">{item.topic}</p>
                <HotSeatAnswers item={item} />
                <p className="text-xs text-fg-muted">
                  Enviada a {formatDate(item.created_at)}
                  {item.session_date ? ` · Sessão de ${formatSessionDate(item.session_date)}` : ''} ·{' '}
                  {item.answered ? 'Respondida' : 'Por responder'}
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
