import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PaymentDialog } from '@/routes/admin/components/PaymentDialog'
import type { Payment, PaymentMethod, Profile } from '@/types/database'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pronto: 'Pronto pagamento',
  prestacoes: 'Prestações',
}

export function AdminFinance() {
  const [dialog, setDialog] = React.useState<{ open: boolean; student: Profile | null }>({
    open: false,
    student: null,
  })

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
  })

  const { data: payments, isLoading: paymentsLoading, refetch } = useQuery({
    queryKey: ['payments-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payments').select('*')
      if (error) throw error
      return data as Payment[]
    },
  })

  if (studentsLoading || paymentsLoading || !students || !payments) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  const receivedByStudent = new Map<string, number>()
  for (const payment of payments) {
    receivedByStudent.set(payment.student_id, (receivedByStudent.get(payment.student_id) ?? 0) + payment.amount)
  }

  const totalDue = students.reduce((acc, s) => acc + (s.mentoria_value ?? 0), 0)
  const totalReceived = payments.reduce((acc, p) => acc + p.amount, 0)
  const totalOutstanding = Math.max(totalDue - totalReceived, 0)

  const isPaid = (student: Profile) => {
    const due = student.mentoria_value ?? 0
    const received = receivedByStudent.get(student.id) ?? 0
    return due > 0 && received >= due
  }
  const paidStudents = students.filter(isPaid)
  const pendingStudents = students.filter((s) => !isPaid(s))

  function renderStudentRow(student: Profile) {
    const received = receivedByStudent.get(student.id) ?? 0
    const due = student.mentoria_value ?? 0
    const pct = due > 0 ? Math.min(Math.round((received / due) * 100), 100) : 0
    return (
      <button
        key={student.id}
        onClick={() => setDialog({ open: true, student })}
        className="flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-border/20"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-fg">{student.full_name}</p>
            {student.payment_method && (
              <Badge variant="outline">
                {PAYMENT_LABELS[student.payment_method]}
                {student.payment_method === 'prestacoes' &&
                  student.installments_count &&
                  ` (${student.installments_count}x)`}
              </Badge>
            )}
          </div>
          {student.payment_method === 'prestacoes' && (
            <p className="mt-1 text-xs text-fg-muted">
              {student.start_date ? `Início: ${student.start_date}` : 'Sem data de início definida'}
            </p>
          )}
          {due > 0 && <Progress value={pct} className="mt-2 max-w-xs" />}
        </div>
        <div className="shrink-0 text-right text-sm">
          <p className="text-fg">
            {received.toFixed(2)} € <span className="text-fg-muted">/ {due.toFixed(2)} €</span>
          </p>
          {due - received > 0 && (
            <p className="text-xs text-fg-muted">{(due - received).toFixed(2)} € em falta</p>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Financeiro</h1>
        <p className="text-sm text-fg-muted">Valor recebido dos alunos.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-fg-muted">Total contratado</p>
            <p className="text-xl font-semibold text-fg">{totalDue.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-fg-muted">Total recebido</p>
            <p className="text-xl font-semibold text-success">{totalReceived.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-fg-muted">Em falta</p>
            <p className="text-xl font-semibold text-fg">{totalOutstanding.toFixed(2)} €</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="em-falta">
        <TabsList>
          <TabsTrigger value="em-falta">Em falta ({pendingStudents.length})</TabsTrigger>
          <TabsTrigger value="pago">Pago ({paidStudents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="em-falta">
          <Card>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              {pendingStudents.map(renderStudentRow)}
              {pendingStudents.length === 0 && (
                <p className="px-4 py-6 text-sm text-fg-muted">Ninguém com pagamentos em falta.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pago">
          <Card>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              {paidStudents.map(renderStudentRow)}
              {paidStudents.length === 0 && (
                <p className="px-4 py-6 text-sm text-fg-muted">Ainda ninguém pagou o valor total.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {students.length === 0 && (
        <p className="px-1 text-sm text-fg-muted">Ainda não tens alunos registados.</p>
      )}

      <PaymentDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
        student={dialog.student}
        onSaved={() => refetch()}
      />
    </div>
  )
}
