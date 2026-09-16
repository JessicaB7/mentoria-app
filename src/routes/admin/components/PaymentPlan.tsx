import * as React from 'react'
import { addMonths, format, isBefore, startOfMonth, startOfToday } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Payment, Profile } from '@/types/database'

type InstallmentStatus = 'pago' | 'atrasado' | 'a-vencer'

interface InstallmentRow {
  student: Profile
  index: number
  total: number
  dueDate: Date
  amount: number
  status: InstallmentStatus
}

const STATUS_LABEL: Record<InstallmentStatus, string> = {
  pago: 'Pago',
  atrasado: 'Em atraso',
  'a-vencer': 'A vencer',
}

const STATUS_VARIANT: Record<InstallmentStatus, 'success' | 'danger' | 'warning'> = {
  pago: 'success',
  atrasado: 'danger',
  'a-vencer': 'warning',
}

function buildSchedule(students: Profile[], receivedByStudent: Map<string, number>): InstallmentRow[] {
  const today = startOfToday()
  const rows: InstallmentRow[] = []

  for (const student of students) {
    if (student.payment_method !== 'prestacoes') continue
    if (!student.installments_count || !student.mentoria_value || !student.start_date) continue

    const amount = student.mentoria_value / student.installments_count
    const received = receivedByStudent.get(student.id) ?? 0
    const startDate = new Date(`${student.start_date}T00:00:00`)

    for (let i = 1; i <= student.installments_count; i++) {
      const dueDate = addMonths(startDate, i - 1)
      const expectedCumulative = amount * i
      const paid = received >= expectedCumulative - 0.01

      let status: InstallmentStatus
      if (paid) status = 'pago'
      else if (isBefore(dueDate, today)) status = 'atrasado'
      else status = 'a-vencer'

      rows.push({ student, index: i, total: student.installments_count, dueDate, amount, status })
    }
  }

  return rows.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

export function PaymentPlan({ students, payments }: { students: Profile[]; payments: Payment[] }) {
  const receivedByStudent = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const payment of payments) {
      map.set(payment.student_id, (map.get(payment.student_id) ?? 0) + payment.amount)
    }
    return map
  }, [payments])

  const schedule = React.useMemo(
    () => buildSchedule(students, receivedByStudent),
    [students, receivedByStudent],
  )

  const currentMonthKey = format(startOfToday(), 'yyyy-MM')

  const months = React.useMemo(() => {
    const groups = new Map<string, InstallmentRow[]>()
    for (const row of schedule) {
      const key = format(startOfMonth(row.dueDate), 'yyyy-MM')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }
    return Array.from(groups.entries())
  }, [schedule])

  const overdueCount = schedule.filter((r) => r.status === 'atrasado').length
  const dueThisMonthCount = schedule.filter(
    (r) => r.status === 'a-vencer' && format(r.dueDate, 'yyyy-MM') === currentMonthKey,
  ).length
  const paidCount = schedule.filter((r) => r.status === 'pago').length

  if (schedule.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-fg-muted">
          Ainda não há alunos com pagamento em prestações (precisas de definir valor da mentoria, número
          de prestações e data de início em cada aluno).
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="danger">{overdueCount} em atraso</Badge>
        <Badge variant="warning">{dueThisMonthCount} a vencer este mês</Badge>
        <Badge variant="success">{paidCount} pagas</Badge>
      </div>

      <div className="flex flex-col gap-4">
        {months.map(([monthKey, rows]) => {
          const isCurrent = monthKey === currentMonthKey
          const expected = rows.reduce((acc, r) => acc + r.amount, 0)
          const receivedThisMonth = rows
            .filter((r) => r.status === 'pago')
            .reduce((acc, r) => acc + r.amount, 0)
          const label = format(rows[0].dueDate, 'MMMM yyyy', { locale: pt })

          return (
            <Card key={monthKey} className={isCurrent ? 'border-primary/50' : undefined}>
              <CardContent className="flex flex-col gap-0 p-0">
                <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold capitalize text-fg">{label}</p>
                    {isCurrent && <Badge>Este mês</Badge>}
                  </div>
                  <p className="text-xs text-fg-muted">
                    {receivedThisMonth.toFixed(2)} € / {expected.toFixed(2)} € esperados
                  </p>
                </div>
                <div className="flex flex-col divide-y divide-border">
                  {rows.map((row) => (
                    <div
                      key={`${row.student.id}-${row.index}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-fg">{row.student.full_name}</p>
                        <p className="text-xs text-fg-muted">
                          Prestação {row.index}/{row.total} · {format(row.dueDate, 'dd/MM')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm text-fg">{row.amount.toFixed(2)} €</span>
                        <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
