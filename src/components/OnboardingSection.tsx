import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { renderRichText } from '@/lib/richText'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Pencil } from 'lucide-react'
import { ONBOARDING_STATUS_LABELS, ONBOARDING_STATUS_ORDER, ONBOARDING_STATUS_VARIANT } from '@/lib/onboardingStatus'
import type { AppSetting, OnboardingStatus, Profile } from '@/types/database'

const DEFAULT_ONBOARDING_TEXT = `**1. Assinatura do Contrato**
Recebes o contrato da mentoria por email — lê com atenção, confirma que os dados estão corretos e assina com a Assinatura Digital do Cartão de Cidadão, em autenticacao.gov.pt/cmd-assinatura. Depois de assinado, reenvia por email.

**2. Pagamento da Entrada**
Garante a tua inscrição — a fazer no prazo de 24h após a assinatura do contrato. Valor e IBAN estão no contrato.

**3. Ativação do Débito Direto**
Depois do pagamento da entrada, ativa a autorização de débito direto para as tuas mensalidades, através do link enviado por email.

**4. Formulário de Check-out**
Preenches os teus dados finais, para prepararmos o teu Plano Individual de Implementação.

**5. Marcação da Sessão de Onboarding**
Depois de todos os passos anteriores cumpridos, marcamos juntas a tua sessão de onboarding — aí mostro-te como tudo funciona.`

export function useOnboardingSectionSettings() {
  return useQuery({
    queryKey: ['onboarding-section-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'onboarding_section_text')
        .maybeSingle()
      if (error) throw error
      const row = data as AppSetting | null
      return { text: row?.value || DEFAULT_ONBOARDING_TEXT }
    },
  })
}

export function OnboardingSection({
  student,
  editable,
  onEditClick,
}: {
  student: Profile
  editable: boolean
  onEditClick?: () => void
}) {
  const queryClient = useQueryClient()
  const { data: settings } = useOnboardingSectionSettings()

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
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Onboarding</CardTitle>
        {editable && onEditClick && (
          <button
            onClick={onEditClick}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-muted hover:bg-border/40 hover:text-fg"
          >
            <Pencil className="size-3.5" />
            Editar
          </button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {editable ? (
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="onboarding-status-select" className="text-xs text-fg-muted">
              Estado atual
            </Label>
            <Select
              value={student.onboarding_status}
              onValueChange={(v) => updateStatus(v as OnboardingStatus)}
            >
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
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Estado atual</p>
            <Badge variant={ONBOARDING_STATUS_VARIANT[student.onboarding_status]} className="mt-1">
              {ONBOARDING_STATUS_LABELS[student.onboarding_status]}
            </Badge>
          </div>
        )}

        <div className="whitespace-pre-wrap border-t border-border pt-4 text-sm leading-relaxed text-fg">
          {renderRichText(settings?.text ?? DEFAULT_ONBOARDING_TEXT)}
        </div>
      </CardContent>
    </Card>
  )
}
