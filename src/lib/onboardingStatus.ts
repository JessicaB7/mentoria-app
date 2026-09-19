import type { OnboardingStatus } from '@/types/database'

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  convidado: 'Convidado',
  contrato_enviado: 'Contrato enviado',
  entrada_paga: 'Entrada paga',
  debito_ativo: 'Débito direto ativo',
  ativo: 'Ativo',
}

// Ordem do funil, do início ao fim.
export const ONBOARDING_STATUS_ORDER: OnboardingStatus[] = [
  'convidado',
  'contrato_enviado',
  'entrada_paga',
  'debito_ativo',
  'ativo',
]

export const ONBOARDING_STATUS_VARIANT: Record<
  OnboardingStatus,
  'outline' | 'warning' | 'success'
> = {
  convidado: 'outline',
  contrato_enviado: 'warning',
  entrada_paga: 'warning',
  debito_ativo: 'warning',
  ativo: 'success',
}
