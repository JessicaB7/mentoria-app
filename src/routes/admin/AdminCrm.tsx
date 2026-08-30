import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Copy, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ContactDialog } from '@/routes/admin/components/ContactDialog'
import { convertContactToStudent } from '@/lib/crmStudent'
import type { CrmContact, CrmStage, CrmTask, PaymentMethod } from '@/types/database'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pronto: 'Pronto pagamento',
  prestacoes: 'Prestações',
}

const STAGES: { value: CrmStage; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'won', label: 'Ganho' },
  { value: 'lost', label: 'Perdido' },
]

export function AdminCrm() {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = React.useState<{ open: boolean; contact: CrmContact | null }>({
    open: false,
    contact: null,
  })
  const [credentials, setCredentials] = React.useState<{ email: string; password: string } | null>(null)

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as CrmContact[]
    },
  })

  const { data: tasks } = useQuery({
    queryKey: ['crm-tasks-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*, crm_contacts(name)')
        .order('due_date', { ascending: true })
      if (error) throw error
      return data as (CrmTask & { crm_contacts: { name: string } | null })[]
    },
  })

  async function moveStage(contact: CrmContact, stage: CrmStage) {
    await supabase.from('crm_contacts').update({ stage }).eq('id', contact.id)
    queryClient.invalidateQueries({ queryKey: ['crm-contacts'] })
    if (stage === 'won' && !contact.student_id) {
      await convertToStudent(contact)
    }
  }

  async function convertToStudent(contact: CrmContact) {
    const result = await convertContactToStudent(contact)
    queryClient.invalidateQueries({ queryKey: ['crm-contacts'] })
    queryClient.invalidateQueries({ queryKey: ['admin-students'] })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(`"${contact.name}" foi adicionado(a) aos alunos.`)
    setCredentials(result.credentials)
  }

  function copyCredentials() {
    if (!credentials) return
    navigator.clipboard.writeText(`Email: ${credentials.email}\nPalavra-passe: ${credentials.password}`)
    toast.success('Credenciais copiadas.')
  }

  async function deleteContact(contact: CrmContact) {
    if (!window.confirm(`Apagar "${contact.name}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('crm_contacts').delete().eq('id', contact.id)
    if (error) {
      toast.error('Não foi possível apagar o contacto.')
      return
    }
    toast.success(`"${contact.name}" foi apagado(a).`)
    queryClient.invalidateQueries({ queryKey: ['crm-contacts'] })
    queryClient.invalidateQueries({ queryKey: ['crm-tasks-all'] })
  }

  async function toggleTaskDone(task: CrmTask) {
    await supabase
      .from('crm_tasks')
      .update({ status: task.status === 'done' ? 'pending' : 'done' })
      .eq('id', task.id)
    queryClient.invalidateQueries({ queryKey: ['crm-tasks-all'] })
  }

  if (isLoading || !contacts) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  const pendingTasks = (tasks ?? []).filter((t) => t.status === 'pending')
  const doneTasks = (tasks ?? []).filter((t) => t.status === 'done')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">CRM</h1>
        <Button onClick={() => setDialog({ open: true, contact: null })}>
          <Plus className="size-4" />
          Novo contacto
        </Button>
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {STAGES.map((stageDef) => (
              <div key={stageDef.value} className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-fg-muted">
                  {stageDef.label} ({contacts.filter((c) => c.stage === stageDef.value).length})
                </p>
                <div className="flex flex-col gap-2">
                  {contacts
                    .filter((c) => c.stage === stageDef.value)
                    .map((contact) => (
                      <Card
                        key={contact.id}
                        className="cursor-pointer p-3"
                        onClick={() => setDialog({ open: true, contact })}
                      >
                        <div className="flex items-center gap-2">
                          <p className="flex-1 text-sm font-medium text-fg">{contact.name}</p>
                          {contact.student_id && <Badge variant="success">Aluno</Badge>}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteContact(contact)
                            }}
                            className="shrink-0 rounded p-1 text-fg-muted hover:text-danger"
                            title="Apagar"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        {contact.source && <p className="text-xs text-fg-muted">{contact.source}</p>}
                        {contact.payment_method && (
                          <p className="text-xs text-fg-muted">
                            {PAYMENT_LABELS[contact.payment_method]}
                            {contact.payment_term && ` · ${contact.payment_term}`}
                          </p>
                        )}
                        {contact.meeting_date && (
                          <p className="text-xs text-fg-muted">
                            Reunião: {contact.meeting_date}
                            {contact.meeting_time && ` · ${contact.meeting_time.slice(0, 5)}`}
                          </p>
                        )}
                        {contact.value != null && (
                          <p className="text-xs text-fg-muted">{contact.value.toFixed(2)} €</p>
                        )}
                        <div onClick={(e) => e.stopPropagation()} className="mt-2">
                          <Select value={contact.stage} onValueChange={(v) => moveStage(contact, v as CrmStage)}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STAGES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {contact.stage === 'won' && !contact.student_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              convertToStudent(contact)
                            }}
                          >
                            Criar conta de aluno
                          </Button>
                        )}
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tarefas">
          <Card>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-fg">{task.title}</p>
                    <p className="text-xs text-fg-muted">
                      {task.crm_contacts?.name} {task.due_date && `· ${task.due_date}`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toggleTaskDone(task)}>
                    Concluir
                  </Button>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <p className="px-4 py-6 text-sm text-fg-muted">Sem tarefas pendentes.</p>
              )}
            </CardContent>
          </Card>

          {doneTasks.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm font-semibold text-fg-muted">Concluídas</p>
              {doneTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2">
                  <Badge variant="success">Feita</Badge>
                  <span className="text-sm text-fg-muted line-through">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ContactDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
        contact={dialog.contact}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['crm-contacts'] })}
      />

      <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conta de aluno criada</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-fg-muted">
            Partilha estas credenciais com o aluno (só ficam visíveis agora):
          </p>
          <div className="rounded-md border border-border bg-background p-3 text-sm">
            <p>
              <span className="text-fg-muted">Email:</span> {credentials?.email}
            </p>
            <p>
              <span className="text-fg-muted">Palavra-passe:</span> {credentials?.password}
            </p>
          </div>
          <Button variant="outline" onClick={copyCredentials} className="w-fit">
            <Copy className="size-4" />
            Copiar
          </Button>
          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
