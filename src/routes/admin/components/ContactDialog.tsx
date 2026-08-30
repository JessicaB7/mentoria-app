import * as React from 'react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, Copy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { convertContactToStudent } from '@/lib/crmStudent'
import type { CrmContact, CrmStage, CrmTask, PaymentMethod } from '@/types/database'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pronto: 'Pronto pagamento',
  prestacoes: 'Prestações',
}

const STAGE_LABELS: Record<CrmStage, string> = {
  lead: 'Lead',
  contacted: 'Contactado',
  proposal: 'Proposta',
  won: 'Ganho',
  lost: 'Perdido',
}

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: CrmContact | null
  onSaved: () => void
}

export function ContactDialog({ open, onOpenChange, contact, onSaved }: ContactDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [source, setSource] = React.useState('')
  const [stage, setStage] = React.useState<CrmStage>('lead')
  const [notes, setNotes] = React.useState('')
  const [meetingDate, setMeetingDate] = React.useState('')
  const [meetingTime, setMeetingTime] = React.useState('')
  const [value, setValue] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod | ''>('')
  const [paymentTerm, setPaymentTerm] = React.useState('')
  const [installmentsCount, setInstallmentsCount] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [taskTitle, setTaskTitle] = React.useState('')
  const [taskDueDate, setTaskDueDate] = React.useState('')
  const [credentials, setCredentials] = React.useState<{ email: string; password: string } | null>(null)

  React.useEffect(() => {
    if (open) {
      setCredentials(null)
      setName(contact?.name ?? '')
      setEmail(contact?.email ?? '')
      setPhone(contact?.phone ?? '')
      setSource(contact?.source ?? '')
      setStage(contact?.stage ?? 'lead')
      setNotes(contact?.notes ?? '')
      setMeetingDate(contact?.meeting_date ?? '')
      setMeetingTime(contact?.meeting_time ?? '')
      setValue(contact?.value != null ? String(contact.value) : '')
      setPaymentMethod(contact?.payment_method ?? '')
      setPaymentTerm(contact?.payment_term ?? '')
      setInstallmentsCount(contact?.installments_count != null ? String(contact.installments_count) : '')
    }
  }, [open, contact])

  const { data: tasks, refetch: refetchTasks } = useQuery({
    queryKey: ['crm-tasks', contact?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('contact_id', contact!.id)
        .order('due_date', { ascending: true })
      if (error) throw error
      return data as CrmTask[]
    },
    enabled: !!contact,
  })

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      name,
      email: email || null,
      phone: phone || null,
      source: source || null,
      stage,
      notes: notes || null,
      meeting_date: meetingDate || null,
      meeting_time: meetingTime || null,
      value: value ? Number(value) : null,
      payment_method: paymentMethod || null,
      payment_term: paymentTerm || null,
      installments_count: paymentMethod === 'prestacoes' && installmentsCount ? Number(installmentsCount) : null,
    }
    const becameWon = stage === 'won' && !contact?.student_id

    const { data: savedContact, error } = contact
      ? await supabase.from('crm_contacts').update(payload).eq('id', contact.id).select().single()
      : await supabase.from('crm_contacts').insert(payload).select().single()
    if (error || !savedContact) {
      setSaving(false)
      toast.error('Não foi possível guardar o contacto.')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['crm-contacts'] })

    if (becameWon) {
      const result = await convertContactToStudent(savedContact as CrmContact)
      setSaving(false)
      if (!result.ok) {
        toast.error(result.error)
        onOpenChange(false)
        onSaved()
        return
      }
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      toast.success(`"${name}" foi adicionado(a) aos alunos.`)
      setCredentials(result.credentials)
      onSaved()
      return
    }

    setSaving(false)
    toast.success('Contacto guardado.')
    onOpenChange(false)
    onSaved()
  }

  function copyCredentials() {
    if (!credentials) return
    navigator.clipboard.writeText(`Email: ${credentials.email}\nPalavra-passe: ${credentials.password}`)
    toast.success('Credenciais copiadas.')
  }

  async function addTask() {
    if (!taskTitle.trim() || !contact) return
    await supabase.from('crm_tasks').insert({
      contact_id: contact.id,
      title: taskTitle,
      due_date: taskDueDate || null,
    })
    setTaskTitle('')
    setTaskDueDate('')
    refetchTasks()
    queryClient.invalidateQueries({ queryKey: ['crm-tasks-all'] })
  }

  async function toggleTask(task: CrmTask) {
    await supabase
      .from('crm_tasks')
      .update({ status: task.status === 'done' ? 'pending' : 'done' })
      .eq('id', task.id)
    refetchTasks()
    queryClient.invalidateQueries({ queryKey: ['crm-tasks-all'] })
  }

  async function deleteTask(task: CrmTask) {
    await supabase.from('crm_tasks').delete().eq('id', task.id)
    refetchTasks()
    queryClient.invalidateQueries({ queryKey: ['crm-tasks-all'] })
  }

  async function deleteContact() {
    if (!contact) return
    if (!window.confirm(`Apagar "${contact.name}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('crm_contacts').delete().eq('id', contact.id)
    if (error) {
      toast.error('Não foi possível apagar o contacto.')
      return
    }
    toast.success(`"${contact.name}" foi apagado(a).`)
    queryClient.invalidateQueries({ queryKey: ['crm-contacts'] })
    queryClient.invalidateQueries({ queryKey: ['crm-tasks-all'] })
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{contact ? 'Editar contacto' : 'Novo contacto'}</DialogTitle>
        </DialogHeader>

        {credentials ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-fg-muted">
              Conta de aluno criada. Partilha estas credenciais com o aluno (só ficam visíveis agora):
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
        ) : (
          <>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-name">Nome</Label>
              <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-stage">Estágio</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as CrmStage)}>
                <SelectTrigger id="contact-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STAGE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-phone">Telefone</Label>
              <Input id="contact-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="contact-source">Origem</Label>
              <Input
                id="contact-source"
                placeholder="Instagram, referência, formulário…"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-meeting-date">Data da reunião</Label>
              <Input
                id="contact-meeting-date"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-meeting-time">Hora da reunião</Label>
              <Input
                id="contact-meeting-time"
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-value">Valor (€)</Label>
              <Input
                id="contact-value"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-payment-method">Método de pagamento</Label>
              <Select
                value={paymentMethod || undefined}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger id="contact-payment-method">
                  <SelectValue placeholder="Selecionar…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-payment-term">Prazo</Label>
              <Input
                id="contact-payment-term"
                placeholder="Ex: até 15/09…"
                value={paymentTerm}
                onChange={(e) => setPaymentTerm(e.target.value)}
              />
            </div>
            {paymentMethod === 'prestacoes' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-installments">Número de prestações</Label>
                <Input
                  id="contact-installments"
                  type="number"
                  min={1}
                  step={1}
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-notes">Notas</Label>
            <Textarea id="contact-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {contact && (
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4">
            <Label>Tarefas de follow-up</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: ligar para marcar chamada"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              <Input
                type="date"
                className="w-40"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={addTask} disabled={!taskTitle.trim()}>
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {(tasks ?? []).map((task) => (
                <div key={task.id} className="flex items-center gap-2 py-2">
                  <Checkbox checked={task.status === 'done'} onCheckedChange={() => toggleTask(task)} />
                  <span
                    className={`flex-1 text-sm ${task.status === 'done' ? 'text-fg-muted line-through' : 'text-fg'}`}
                  >
                    {task.title}
                  </span>
                  {task.due_date && <span className="text-xs text-fg-muted">{task.due_date}</span>}
                  <button onClick={() => deleteTask(task)} className="text-fg-muted hover:text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {(tasks ?? []).length === 0 && (
                <p className="py-2 text-sm text-fg-muted">Sem tarefas para este contacto.</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {contact && (
            <Button
              variant="outline"
              className="mr-auto text-danger hover:text-danger"
              onClick={deleteContact}
            >
              <Trash2 className="size-4" />
              Apagar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            Guardar
          </Button>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
