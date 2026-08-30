import * as React from 'react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Payment, Profile } from '@/types/database'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Profile | null
  onSaved: () => void
}

export function PaymentDialog({ open, onOpenChange, student, onSaved }: PaymentDialogProps) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = React.useState('')
  const [paidAt, setPaidAt] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setAmount('')
      setPaidAt(new Date().toISOString().slice(0, 10))
      setNotes('')
    }
  }, [open, student])

  const { data: payments, refetch } = useQuery({
    queryKey: ['payments', student?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', student!.id)
        .order('paid_at', { ascending: false })
      if (error) throw error
      return data as Payment[]
    },
    enabled: !!student,
  })

  const totalReceived = (payments ?? []).reduce((acc, p) => acc + p.amount, 0)
  const totalDue = student?.mentoria_value ?? 0
  const remaining = totalDue - totalReceived

  function refresh() {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['payments-all'] })
    onSaved()
  }

  async function addPayment() {
    if (!student) return
    const numericAmount = amount ? Number(amount) : 0
    if (Number.isNaN(numericAmount) || numericAmount < 0) return
    if (numericAmount === 0 && !notes.trim()) return
    setSaving(true)
    const { error } = await supabase.from('payments').insert({
      student_id: student.id,
      amount: numericAmount,
      paid_at: paidAt,
      notes: notes || null,
    })
    setSaving(false)
    if (error) {
      toast.error('Não foi possível registar o pagamento.')
      return
    }
    toast.success('Pagamento registado.')
    setAmount('')
    setNotes('')
    refresh()
  }

  async function deletePayment(payment: Payment) {
    if (!confirm('Eliminar este pagamento?')) return
    await supabase.from('payments').delete().eq('id', payment.id)
    refresh()
  }

  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pagamentos — {student.full_name}</DialogTitle>
          {student.payment_method === 'prestacoes' && student.installments_count && (
            <p className="text-sm text-fg-muted">
              {(payments ?? []).length} de {student.installments_count} prestações registadas
            </p>
          )}
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 rounded-md border border-border bg-background p-3 text-sm">
          <div>
            <p className="text-xs text-fg-muted">Total</p>
            <p className="font-medium text-fg">{totalDue.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-xs text-fg-muted">Recebido</p>
            <p className="font-medium text-success">{totalReceived.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-xs text-fg-muted">Em falta</p>
            <p className="font-medium text-fg">{Math.max(remaining, 0).toFixed(2)} €</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label>Novo pagamento</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor (€)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              type="date"
              className="w-40"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addPayment}
              disabled={saving || (!amount && !notes.trim())}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <Input placeholder="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <p className="text-xs text-fg-muted">
            Deixa o valor em branco para registar apenas uma nota (fica com 0,00 €).
          </p>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {(payments ?? []).map((payment) => (
            <div key={payment.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg">
                  {payment.amount > 0 ? `${payment.amount.toFixed(2)} €` : 'Nota'}
                </p>
                <p className="truncate text-xs text-fg-muted">
                  {payment.paid_at}
                  {payment.notes && ` · ${payment.notes}`}
                </p>
              </div>
              <button onClick={() => deletePayment(payment)} className="text-fg-muted hover:text-danger">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {(payments ?? []).length === 0 && (
            <p className="py-2 text-sm text-fg-muted">Sem pagamentos registados.</p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
