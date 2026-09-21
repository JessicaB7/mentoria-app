import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CircleDollarSign, ClipboardList, MessageSquareWarning } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { buildPaymentSchedule, receivedByStudentMap } from '@/lib/paymentSchedule'
import type { Payment, Profile, StudentFeedback } from '@/types/database'

function hasCheckIn(student: Profile) {
  return Boolean(
    student.current_services ||
      (student.challenges && student.challenges.length > 0) ||
      student.other_challenges ||
      student.enrollment_reason ||
      student.success_definition ||
      student.learning_goals ||
      student.additional_notes,
  )
}

function AttentionGroup({
  icon: Icon,
  label,
  students,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  students: Profile[]
}) {
  if (students.length === 0) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-warning" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">
          {students.length} {label}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5">
          {students.map((s, i) => (
            <React.Fragment key={s.id}>
              <Link
                to={`/admin/individual/${s.id}`}
                className="text-xs text-fg-muted underline-offset-2 hover:text-primary hover:underline"
              >
                {s.full_name}
              </Link>
              {i < students.length - 1 && <span className="text-xs text-fg-muted">·</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AdminAttentionPanel() {
  const { data } = useQuery({
    queryKey: ['admin-attention-panel'],
    queryFn: async () => {
      const [
        { data: students, error: studentsError },
        { data: payments, error: paymentsError },
        { data: feedback, error: feedbackError },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student'),
        supabase.from('payments').select('*'),
        supabase.from('student_feedback').select('*'),
      ])
      if (studentsError) throw studentsError
      if (paymentsError) throw paymentsError
      if (feedbackError) throw feedbackError

      return {
        students: (students ?? []) as Profile[],
        payments: (payments ?? []) as Payment[],
        feedback: (feedback ?? []) as StudentFeedback[],
      }
    },
  })

  const groups = React.useMemo(() => {
    if (!data) return null
    const { students, payments, feedback } = data

    const missingCheckIn = students.filter((s) => !hasCheckIn(s))

    const receivedByStudent = receivedByStudentMap(payments)
    const schedule = buildPaymentSchedule(students, receivedByStudent)
    const overdueStudentIds = new Set(
      schedule.filter((r) => r.status === 'atrasado').map((r) => r.student.id),
    )
    const overduePayments = students.filter((s) => overdueStudentIds.has(s.id))

    const feedbackByStudent = new Set(feedback.map((f) => f.student_id))
    const today = new Date()
    const endingWithoutFeedback = students.filter((s) => {
      if (!s.end_date || feedbackByStudent.has(s.id)) return false
      const from = new Date(`${s.end_date}T00:00:00`)
      from.setDate(from.getDate() - 14)
      return today >= from
    })

    return { missingCheckIn, overduePayments, endingWithoutFeedback }
  }, [data])

  if (!groups) return null
  const { missingCheckIn, overduePayments, endingWithoutFeedback } = groups
  const total = missingCheckIn.length + overduePayments.length + endingWithoutFeedback.length

  if (total === 0) return null

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="flex flex-col gap-3 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-warning">
          Precisa da tua atenção
        </p>
        <AttentionGroup
          icon={ClipboardList}
          label={missingCheckIn.length === 1 ? 'aluno sem Check-in preenchido' : 'alunos sem Check-in preenchido'}
          students={missingCheckIn}
        />
        <AttentionGroup
          icon={CircleDollarSign}
          label={overduePayments.length === 1 ? 'aluno com pagamento em atraso' : 'alunos com pagamentos em atraso'}
          students={overduePayments}
        />
        <AttentionGroup
          icon={MessageSquareWarning}
          label={
            endingWithoutFeedback.length === 1
              ? 'ciclo a terminar sem feedback pedido'
              : 'ciclos a terminar sem feedback pedido'
          }
          students={endingWithoutFeedback}
        />
      </CardContent>
    </Card>
  )
}
