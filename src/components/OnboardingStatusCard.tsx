import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ONBOARDING_STATUS_LABELS, ONBOARDING_STATUS_ORDER } from '@/lib/onboardingStatus'
import type { OnboardingStatus, Profile } from '@/types/database'

export function OnboardingStatusCard({ student }: { student: Profile }) {
  const queryClient = useQueryClient()

  async function updateStatus(status: OnboardingStatus) {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_status: status })
      .eq('id', student.id)
    if (error) {
      toast.error('Não foi possível atualizar o estado de onboarding.')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['student-profile', student.id] })
    queryClient.invalidateQueries({ queryKey: ['admin-students'] })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label htmlFor="onboarding-status-select">Estado de onboarding</Label>
          <p className="text-xs text-fg-muted">
            Contrato e débito direto continuam a tratar-se por email/GoCardless — isto é só o teu
            checklist de onde este aluno está no processo.
          </p>
        </div>
        <Select value={student.onboarding_status} onValueChange={(v) => updateStatus(v as OnboardingStatus)}>
          <SelectTrigger id="onboarding-status-select" className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ONBOARDING_STATUS_ORDER.map((status) => (
              <SelectItem key={status} value={status}>
                {ONBOARDING_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
