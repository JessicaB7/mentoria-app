import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/spinner'
import type { HotSeatQuestion } from '@/types/database'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Dúvidas que a aluna enviou para o Hot Seat com sessão iniciada, e se já foram respondidas.
export function MyHotSeatQuestions({ studentId }: { studentId: string }) {
  const { data: questions, isLoading } = useQuery({
    queryKey: ['my-hot-seat-questions', studentId],
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

  return (
    <div className="flex flex-col gap-3">
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
              <p className="text-xs text-fg-muted">
                Enviada a {formatDateTime(item.created_at)} ·{' '}
                {item.answered ? (
                  <span className="font-medium text-primary">Respondida</span>
                ) : (
                  'Por responder'
                )}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
