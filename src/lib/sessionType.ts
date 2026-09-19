import type { SessionType } from '@/types/database'

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  boas_vindas: 'Boas-vindas',
  convidado: 'Convidado',
  encerramento: 'Encerramento',
  presencial: 'Presencial',
}
