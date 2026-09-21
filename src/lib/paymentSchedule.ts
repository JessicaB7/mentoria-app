import { addMonths, isBefore, startOfToday } from 'date-fns'
import type { Payment, Profile } from '@/types/database'

export type InstallmentStatus = 'pago' | 'atrasado' | 'a-vencer'

export interface InstallmentRow {
  student: Profile
  kind: 'entrada' | 'prestacao'
  index: number
  total: number
  dueDate: Date
  amount: number
  status: InstallmentStatus
}

export function receivedByStudentMap(payments: Payment[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const payment of payments) {
    map.set(payment.student_id, (map.get(payment.student_id) ?? 0) + payment.amount)
  }
  return map
}

// Calendário de prestações (entrada + parcelas) a partir da data de início,
// valor da mentoria e pagamentos já registados. Usado no Plano mensal
// (Financeiro) e no Painel de atenção (Alunos).
export function buildPaymentSchedule(
  students: Profile[],
  receivedByStudent: Map<string, number>,
): InstallmentRow[] {
  const today = startOfToday()
  const rows: InstallmentRow[] = []

  for (const student of students) {
    if (student.payment_method !== 'prestacoes') continue
    if (!student.installments_count || !student.mentoria_value || !student.start_date) continue

    const received = receivedByStudent.get(student.id) ?? 0
    const startDate = new Date(`${student.start_date}T00:00:00`)
    const downPayment = student.down_payment && student.down_payment > 0 ? student.down_payment : 0
    const remaining = student.mentoria_value - downPayment
    const installmentAmount = remaining / student.installments_count

    function statusFor(dueDate: Date, expectedCumulative: number): InstallmentStatus {
      if (received >= expectedCumulative - 0.01) return 'pago'
      if (isBefore(dueDate, today)) return 'atrasado'
      return 'a-vencer'
    }

    let cumulative = 0

    if (downPayment > 0) {
      cumulative += downPayment
      rows.push({
        student,
        kind: 'entrada',
        index: 0,
        total: student.installments_count,
        dueDate: startDate,
        amount: downPayment,
        status: statusFor(startDate, cumulative),
      })
    }

    for (let i = 1; i <= student.installments_count; i++) {
      const dueDate = addMonths(startDate, downPayment > 0 ? i : i - 1)
      cumulative += installmentAmount
      rows.push({
        student,
        kind: 'prestacao',
        index: i,
        total: student.installments_count,
        dueDate,
        amount: installmentAmount,
        status: statusFor(dueDate, cumulative),
      })
    }
  }

  return rows.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}
