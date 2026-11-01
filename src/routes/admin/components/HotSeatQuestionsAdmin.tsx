import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { HotSeatAnswers } from '@/components/HotSeatQuestionForm'
import { formatSessionDate } from '@/lib/liveSections'
import type { HotSeatQuestion } from '@/types/database'

type Row = HotSeatQuestion & { profiles: { full_name: string; email: string } | null }

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function HotSeatQuestionsAdmin() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = React.useState<'pending' | 'answered' | 'all'>('pending')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-hot-seat-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hot_seat_questions')
        .select('*, profiles(full_name, email)')
        .order('session_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as Row[]
    },
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['admin-hot-seat-questions'] })
  }

  async function toggleAnswered(item: Row) {
    const answered = !item.answered
    const { error } = await supabase
      .from('hot_seat_questions')
      .update({ answered, answered_at: answered ? new Date().toISOString() : null })
      .eq('id', item.id)
    if (error) {
      toast.error('Não foi possível atualizar a dúvida.')
      return
    }
    refresh()
  }

  async function remove(item: Row) {
    if (!confirm('Eliminar esta dúvida?')) return
    const { error } = await supabase.from('hot_seat_questions').delete().eq('id', item.id)
    if (error) {
      toast.error('Não foi possível eliminar a dúvida.')
      return
    }
    refresh()
  }

  async function copyLink() {
    const link = `${window.location.origin}/aluno/ao-vivo?tab=duvidas`
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copiado! Já podes colar e enviar às alunas.')
    } catch {
      toast.message(link)
    }
  }

  const rows = data ?? []
  const pendingCount = rows.filter((r) => !r.answered).length
  const visible = rows.filter((r) => (filter === 'all' ? true : filter === 'answered' ? r.answered : !r.answered))

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-fg">Dúvidas para o Hot Seat</h2>
          <p className="text-sm text-fg-muted">
            {pendingCount === 1 ? '1 dúvida por responder' : `${pendingCount} dúvidas por responder`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={copyLink}>
          <Link2 className="size-4" />
          Copiar link do formulário
        </Button>
        <div className="inline-flex gap-1 rounded-lg border border-border bg-surface p-1">
          {(
            [
              ['pending', 'Por responder'],
              ['answered', 'Respondidas'],
              ['all', 'Todas'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium text-fg-muted transition-colors',
                filter === value && 'bg-primary text-primary-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {isLoading ? (
        <Spinner className="size-5" />
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-5 text-sm text-fg-muted">Sem dúvidas aqui.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <Checkbox
                className="mt-0.5"
                checked={item.answered}
                onCheckedChange={() => toggleAnswered(item)}
                aria-label="Marcar como respondida"
              />
              <div className={cn('flex min-w-0 flex-1 flex-col gap-2', item.answered && 'opacity-60')}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm font-semibold text-fg">{item.profiles?.full_name || item.profiles?.email || 'Aluno'}</p>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">{item.topic}</span>
                  <span className="text-xs text-fg-muted">
                    {item.session_date ? `Sessão de ${formatSessionDate(item.session_date)}` : 'Próxima sessão'} · enviada a{' '}
                    {formatDate(item.created_at)}
                  </span>
                </div>
                <HotSeatAnswers item={item} />
              </div>
              <button
                type="button"
                onClick={() => remove(item)}
                className="text-fg-muted hover:text-fg"
                aria-label="Eliminar dúvida"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
