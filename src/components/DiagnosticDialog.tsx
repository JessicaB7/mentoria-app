import * as React from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { CHALLENGE_OPTIONS } from '@/lib/challenges'
import type { BusinessType, Profile } from '@/types/database'

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  independente: 'Trabalhador independente',
  empresa: 'Empresa',
  ainda_nao_comecei: 'Ainda não comecei',
}

export function DiagnosticDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Profile
}) {
  const queryClient = useQueryClient()
  const [businessType, setBusinessType] = React.useState<BusinessType | ''>('')
  const [businessArea, setBusinessArea] = React.useState('')
  const [currentClients, setCurrentClients] = React.useState('')
  const [currentServices, setCurrentServices] = React.useState('')
  const [challenges, setChallenges] = React.useState<string[]>([])
  const [otherChallenges, setOtherChallenges] = React.useState('')
  const [enrollmentReason, setEnrollmentReason] = React.useState('')
  const [successDefinition, setSuccessDefinition] = React.useState('')
  const [learningGoals, setLearningGoals] = React.useState('')
  const [additionalNotes, setAdditionalNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setBusinessType(student.business_type ?? '')
      setBusinessArea(student.business_area ?? '')
      setCurrentClients(student.current_clients ?? '')
      setCurrentServices(student.current_services ?? '')
      setChallenges(student.challenges ?? [])
      setOtherChallenges(student.other_challenges ?? '')
      setEnrollmentReason(student.enrollment_reason ?? '')
      setSuccessDefinition(student.success_definition ?? '')
      setLearningGoals(student.learning_goals ?? '')
      setAdditionalNotes(student.additional_notes ?? '')
    }
  }, [open, student])

  function toggleChallenge(option: string) {
    setChallenges((current) =>
      current.includes(option) ? current.filter((c) => c !== option) : [...current, option],
    )
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        business_type: businessType || null,
        business_area: businessArea.trim() || null,
        current_clients: currentClients.trim() || null,
        current_services: currentServices.trim() || null,
        challenges: challenges.length > 0 ? challenges : null,
        other_challenges: otherChallenges.trim() || null,
        enrollment_reason: enrollmentReason.trim() || null,
        success_definition: successDefinition.trim() || null,
        learning_goals: learningGoals.trim() || null,
        additional_notes: additionalNotes.trim() || null,
      })
      .eq('id', student.id)
    setSaving(false)
    if (error) {
      toast.error('Não foi possível guardar o check-in.')
      return
    }
    toast.success('Check-in Mentoria atualizado.')
    queryClient.invalidateQueries({ queryKey: ['student-profile', student.id] })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Check-in Mentoria — {student.full_name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="diag-business-type">Tipo de negócio</Label>
            <Select value={businessType || undefined} onValueChange={(v) => setBusinessType(v as BusinessType)}>
              <SelectTrigger id="diag-business-type">
                <SelectValue placeholder="Selecionar…" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(BUSINESS_TYPE_LABELS) as [BusinessType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="diag-business-area">Área de atuação</Label>
            <Input id="diag-business-area" value={businessArea} onChange={(e) => setBusinessArea(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="diag-current-clients">Nº de clientes atuais</Label>
            <Input
              id="diag-current-clients"
              value={currentClients}
              onChange={(e) => setCurrentClients(e.target.value)}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="diag-current-services">Quais os serviços que tens atualmente?</Label>
            <Textarea
              id="diag-current-services"
              value={currentServices}
              onChange={(e) => setCurrentServices(e.target.value)}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Quais os teus maiores desafios atualmente?</Label>
            <div className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
              {CHALLENGE_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-fg">
                  <Checkbox checked={challenges.includes(option)} onCheckedChange={() => toggleChallenge(option)} />
                  {option}
                </label>
              ))}
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="diag-other-challenges">Outros desafios não enumerados no ponto anterior</Label>
            <Input
              id="diag-other-challenges"
              value={otherChallenges}
              onChange={(e) => setOtherChallenges(e.target.value)}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="diag-enrollment-reason">Quais os motivos de te teres inscrito neste programa?</Label>
            <Textarea
              id="diag-enrollment-reason"
              value={enrollmentReason}
              onChange={(e) => setEnrollmentReason(e.target.value)}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="diag-success-definition">
              Quando terminares a mentoria, como vais saber que foi um sucesso para ti?
            </Label>
            <Textarea
              id="diag-success-definition"
              value={successDefinition}
              onChange={(e) => setSuccessDefinition(e.target.value)}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="diag-learning-goals">Tens alguma dúvida ou algo que gostavas MESMO de aprender?</Label>
            <Textarea id="diag-learning-goals" value={learningGoals} onChange={(e) => setLearningGoals(e.target.value)} />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="diag-additional-notes">Algo tópico a acrescentar?</Label>
            <Textarea
              id="diag-additional-notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
