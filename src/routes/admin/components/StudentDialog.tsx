import * as React from 'react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { Copy, Trash2, TriangleAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type {
  CrmContact,
  CrmTask,
  LessonProgress,
  Payment,
  PaymentChannel,
  PaymentMethod,
  Profile,
  StudentFeedback,
} from '@/types/database'

const PAYMENT_CHANNEL_LABELS: Record<PaymentChannel, string> = {
  transferencia: 'Transferência bancária',
  gocardless: 'GoCardless',
}

const STAGE_LABELS_HISTORY: Record<string, string> = {
  lead: 'Lead',
  contacted: 'Contactado',
  proposal: 'Proposta',
  won: 'Ganho',
  lost: 'Perdido',
}

function StudentHistory({ student }: { student: Profile }) {
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['student-history-payments', student.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', student.id)
        .order('paid_at', { ascending: false })
      if (error) throw error
      return data as Payment[]
    },
  })

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['student-history-progress', student.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*, lessons(title)')
        .eq('student_id', student.id)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
      if (error) throw error
      return data as (LessonProgress & { lessons: { title: string } | null })[]
    },
  })

  const { data: crmContact, isLoading: crmLoading } = useQuery({
    queryKey: ['student-history-crm', student.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*, crm_tasks(*)')
        .eq('student_id', student.id)
        .maybeSingle()
      if (error) throw error
      return data as (CrmContact & { crm_tasks: CrmTask[] }) | null
    },
  })

  const { data: feedback, isLoading: feedbackLoading } = useQuery({
    queryKey: ['student-history-feedback', student.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_feedback')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as StudentFeedback[]
    },
  })

  if (paymentsLoading || progressLoading || crmLoading || feedbackLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  const totalReceived = (payments ?? []).reduce((acc, p) => acc + p.amount, 0)

  return (
    <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto">
      <div>
        <p className="mb-2 text-sm font-semibold text-fg">Origem (CRM)</p>
        {crmContact ? (
          <div className="rounded-md border border-border bg-background p-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{STAGE_LABELS_HISTORY[crmContact.stage]}</Badge>
              {crmContact.source && <span className="text-fg-muted">{crmContact.source}</span>}
            </div>
            {crmContact.meeting_date && (
              <p className="mt-1 text-xs text-fg-muted">
                Reunião: {crmContact.meeting_date}
                {crmContact.meeting_time && ` · ${crmContact.meeting_time.slice(0, 5)}`}
              </p>
            )}
            {crmContact.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-fg-muted">{crmContact.notes}</p>}
            {crmContact.crm_tasks?.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
                {crmContact.crm_tasks.map((task) => (
                  <p key={task.id} className="text-xs text-fg-muted">
                    {task.status === 'done' ? '✓' : '•'} {task.title}
                    {task.due_date && ` · ${task.due_date}`}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-fg-muted">Sem contacto de CRM associado.</p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-fg">
          Pagamentos <span className="font-normal text-fg-muted">({totalReceived.toFixed(2)} € recebidos)</span>
        </p>
        <div className="flex flex-col divide-y divide-border rounded-md border border-border">
          {(payments ?? []).map((payment) => (
            <div key={payment.id} className="px-3 py-2 text-sm">
              <p className="font-medium text-fg">{payment.amount > 0 ? `${payment.amount.toFixed(2)} €` : 'Nota'}</p>
              <p className="text-xs text-fg-muted">
                {payment.paid_at}
                {payment.notes && ` · ${payment.notes}`}
              </p>
            </div>
          ))}
          {(payments ?? []).length === 0 && (
            <p className="px-3 py-3 text-sm text-fg-muted">Sem pagamentos registados.</p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-fg">
          Aulas concluídas <span className="font-normal text-fg-muted">({(progress ?? []).length})</span>
        </p>
        <div className="flex flex-col divide-y divide-border rounded-md border border-border">
          {(progress ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-fg">{p.lessons?.title ?? 'Aula'}</span>
              <span className="text-xs text-fg-muted">{p.completed_at?.slice(0, 10)}</span>
            </div>
          ))}
          {(progress ?? []).length === 0 && (
            <p className="px-3 py-3 text-sm text-fg-muted">Ainda não concluiu nenhuma aula.</p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-fg">Feedback</p>
        <div className="flex flex-col divide-y divide-border rounded-md border border-border">
          {(feedback ?? []).map((f) => (
            <div key={f.id} className="px-3 py-2 text-sm">
              <p className="font-medium text-fg">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</p>
              {f.comment && <p className="mt-0.5 text-xs text-fg-muted">{f.comment}</p>}
              <p className="mt-0.5 text-xs text-fg-muted">{f.created_at.slice(0, 10)}</p>
            </div>
          ))}
          {(feedback ?? []).length === 0 && (
            <p className="px-3 py-3 text-sm text-fg-muted">Ainda sem feedback registado.</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface StudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Profile | null
  onSaved: () => void
}

export function StudentDialog({ open, onOpenChange, student, onSaved }: StudentDialogProps) {
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [cycleNotes, setCycleNotes] = React.useState('')
  const [mainGoal, setMainGoal] = React.useState('')
  const [mentoriaValue, setMentoriaValue] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod | ''>('')
  const [paymentChannel, setPaymentChannel] = React.useState<PaymentChannel | ''>('')
  const [downPayment, setDownPayment] = React.useState('')
  const [installmentsCount, setInstallmentsCount] = React.useState('')
  const [taxId, setTaxId] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [credentials, setCredentials] = React.useState<{ email: string; password: string } | null>(null)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setConfirmingDelete(false)
      setFullName(student?.full_name ?? '')
      setEmail(student?.email ?? '')
      setPhone(student?.phone ?? '')
      setStartDate(student?.start_date ?? '')
      setEndDate(student?.end_date ?? '')
      setCycleNotes(student?.cycle_notes ?? '')
      setMainGoal(student?.main_goal ?? '')
      setMentoriaValue(student?.mentoria_value != null ? String(student.mentoria_value) : '')
      setPaymentMethod(student?.payment_method ?? '')
      setPaymentChannel(student?.payment_channel ?? '')
      setDownPayment(student?.down_payment != null ? String(student.down_payment) : '')
      setInstallmentsCount(student?.installments_count != null ? String(student.installments_count) : '')
      setTaxId(student?.tax_id ?? '')
      setCredentials(null)
    }
  }, [open, student])

  async function handleSave() {
    if (!fullName.trim()) return
    setSaving(true)

    const enrollmentFields = {
      full_name: fullName,
      phone: phone || null,
      start_date: startDate || null,
      end_date: endDate || null,
      cycle_notes: cycleNotes.trim() || null,
      main_goal: mainGoal.trim() || null,
      mentoria_value: mentoriaValue ? Number(mentoriaValue) : null,
      payment_method: paymentMethod || null,
      payment_channel: paymentChannel || null,
      down_payment: paymentMethod === 'prestacoes' && downPayment ? Number(downPayment) : null,
      installments_count: paymentMethod === 'prestacoes' && installmentsCount ? Number(installmentsCount) : null,
      tax_id: taxId.trim() || null,
    }

    if (student) {
      const { error } = await supabase.from('profiles').update(enrollmentFields).eq('id', student.id)
      setSaving(false)
      if (error) {
        toast.error('Não foi possível guardar as alterações.')
        return
      }
      toast.success('Aluno atualizado.')
      onOpenChange(false)
      onSaved()
      return
    }

    if (!email.trim()) {
      setSaving(false)
      return
    }
    const { data, error } = await supabase.functions.invoke('create-student', {
      body: { email, full_name: fullName, phone: phone || null },
    })
    if (error || data?.error) {
      setSaving(false)
      toast.error(data?.error ?? 'Não foi possível criar o aluno.')
      return
    }
    await supabase.from('profiles').update(enrollmentFields).eq('id', data.user_id)
    setSaving(false)
    setCredentials({ email, password: data.password })
    onSaved()
  }

  function copyCredentials() {
    if (!credentials) return
    navigator.clipboard.writeText(`Email: ${credentials.email}\nPalavra-passe: ${credentials.password}`)
    toast.success('Credenciais copiadas.')
  }

  async function handleDelete() {
    if (!student) return
    setDeleting(true)
    const { data, error } = await supabase.functions.invoke('delete-student', {
      body: { student_id: student.id },
    })
    setDeleting(false)
    if (error || data?.error) {
      toast.error(data?.error ?? 'Não foi possível apagar o aluno.')
      return
    }
    toast.success('Aluno apagado.')
    onOpenChange(false)
    onSaved()
  }

  const studentFormFields = (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="student-name">Nome</Label>
        <Input id="student-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="student-email">Email</Label>
        <Input
          id="student-email"
          type="email"
          value={email}
          disabled={!!student}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="student-phone">Número de telefone</Label>
        <Input id="student-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="student-start-date">Data de início</Label>
        <Input
          id="student-start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="student-end-date">Fim previsto do ciclo</Label>
        <Input
          id="student-end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      {endDate && (
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="student-cycle-notes">Notas sobre o ciclo (opcional)</Label>
          <Input
            id="student-cycle-notes"
            placeholder="Ex.: +15 dias — motivo: pausa de dezembro"
            value={cycleNotes}
            onChange={(e) => setCycleNotes(e.target.value)}
          />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="student-tax-id">NIF a faturar</Label>
        <Input id="student-tax-id" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="student-main-goal">Objetivo principal</Label>
        <Textarea
          id="student-main-goal"
          placeholder="Ex.: Passar de 20 para 50 clientes recorrentes até final do ano."
          value={mainGoal}
          onChange={(e) => setMainGoal(e.target.value)}
        />
        <p className="text-xs text-fg-muted">
          Este diagnóstico aparece no início do Acompanhamento Individual do aluno.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="student-value">Valor da mentoria (€)</Label>
        <Input
          id="student-value"
          type="number"
          min={0}
          step="0.01"
          value={mentoriaValue}
          onChange={(e) => setMentoriaValue(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="student-payment">Método de pagamento</Label>
        <Select value={paymentMethod || undefined} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
          <SelectTrigger id="student-payment">
            <SelectValue placeholder="Selecionar…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pronto">Pronto pagamento</SelectItem>
            <SelectItem value="prestacoes">Prestações</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="student-payment-channel">Canal de recebimento</Label>
        <Select
          value={paymentChannel || undefined}
          onValueChange={(v) => setPaymentChannel(v as PaymentChannel)}
        >
          <SelectTrigger id="student-payment-channel">
            <SelectValue placeholder="Selecionar…" />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(PAYMENT_CHANNEL_LABELS) as [PaymentChannel, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      {paymentMethod === 'prestacoes' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="student-down-payment">Valor de entrada (€)</Label>
          <Input
            id="student-down-payment"
            type="number"
            min={0}
            step="0.01"
            placeholder="Opcional"
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
          />
        </div>
      )}
      {paymentMethod === 'prestacoes' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="student-installments">
            {downPayment ? 'Número de prestações (após entrada)' : 'Número de prestações'}
          </Label>
          <Input
            id="student-installments"
            type="number"
            min={1}
            step={1}
            value={installmentsCount}
            onChange={(e) => setInstallmentsCount(e.target.value)}
          />
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{student ? 'Editar aluno' : 'Novo aluno'}</DialogTitle>
        </DialogHeader>

        {credentials ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-fg-muted">
              Conta criada. Partilha estas credenciais com o aluno (só ficam visíveis agora):
            </p>
            <div className="rounded-md border border-border bg-background p-3 text-sm">
              <p>
                <span className="text-fg-muted">Email:</span> {credentials.email}
              </p>
              <p>
                <span className="text-fg-muted">Palavra-passe:</span> {credentials.password}
              </p>
            </div>
            <Button variant="outline" onClick={copyCredentials} className="w-fit">
              <Copy className="size-4" />
              Copiar
            </Button>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : confirmingDelete && student ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-fg">
              <TriangleAlert className="size-5 shrink-0 text-danger" />
              <div>
                <p className="font-medium">Apagar {student.full_name}?</p>
                <p className="mt-1 text-fg-muted">
                  Esta ação é irreversível: apaga o acesso do aluno e todos os dados associados
                  (aulas individuais, progresso, pagamentos, entregáveis e feedback).
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'A apagar…' : 'Sim, apagar aluno'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            {student ? (
              <Tabs defaultValue="dados">
                <TabsList>
                  <TabsTrigger value="dados">Dados</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="dados">{studentFormFields}</TabsContent>
                <TabsContent value="historico">
                  <StudentHistory student={student} />
                </TabsContent>
              </Tabs>
            ) : (
              studentFormFields
            )}
            <DialogFooter className={student ? 'justify-between' : undefined}>
              {student && (
                <Button variant="outline" className="text-danger hover:text-danger" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 className="size-4" />
                  Apagar aluno
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !fullName.trim() || (!student && !email.trim())}
                >
                  Guardar
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
