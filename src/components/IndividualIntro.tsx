import { useQuery } from '@tanstack/react-query'
import { CalendarDays, CalendarCheck2, Clock, Pencil, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { renderRichText } from '@/lib/richText'
import type { AppSetting, BusinessType, Profile } from '@/types/database'

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  independente: 'Trabalhador independente',
  empresa: 'Empresa',
  ainda_nao_comecei: 'Ainda não comecei',
}

const DEFAULT_INTRO_TEXT =
  'Este é o teu espaço de **acompanhamento individual** — sessões 1:1 pensadas exclusivamente para o teu negócio e para os desafios do teu dia a dia como contabilista.\n\nAqui vais encontrar cada sessão, com o resumo, os materiais partilhados e os próximos passos combinados. Antes do próximo encontro, vale a pena rever a sessão anterior para chegares com tudo fresco.'

const DEFAULT_INTRO_QUOTE =
  'Grandes negócios não nascem de grandes saltos — nascem de pequenos passos consistentes, sessão após sessão.'

const SETTINGS_KEYS = [
  'individual_intro_text',
  'individual_intro_quote',
  'individual_sla_text',
  'individual_scheduling_url',
] as const

export function useIndividualIntroSettings() {
  return useQuery({
    queryKey: ['individual-intro-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .in('key', SETTINGS_KEYS as unknown as string[])
      if (error) throw error
      const rows = (data ?? []) as AppSetting[]
      const byKey = new Map(rows.map((r) => [r.key, r.value]))
      return {
        text: byKey.get('individual_intro_text') || DEFAULT_INTRO_TEXT,
        quote: byKey.get('individual_intro_quote') || DEFAULT_INTRO_QUOTE,
        sla: byKey.get('individual_sla_text') || '',
        schedulingUrl: byKey.get('individual_scheduling_url') || '',
      }
    },
  })
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function IndividualIntro({
  student,
  onEditClick,
}: {
  student: Profile
  onEditClick?: () => void
}) {
  const { data: settings } = useIndividualIntroSettings()

  const formattedStartDate = student.start_date ? formatDate(student.start_date) : null
  const formattedEndDate = student.end_date ? formatDate(student.end_date) : null

  return (
    <div className="relative overflow-hidden rounded-lg border border-primary/30 bg-surface p-5">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
      {onEditClick && (
        <button
          onClick={onEditClick}
          className="absolute right-3 top-3 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-muted hover:bg-border/40 hover:text-fg"
        >
          <Pencil className="size-3.5" />
          Editar
        </button>
      )}
      <div className="flex flex-col gap-4 pl-2">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
          {renderRichText(settings?.text ?? DEFAULT_INTRO_TEXT)}
        </p>

        {(formattedStartDate || formattedEndDate || student.main_goal) && (
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:gap-8">
            {formattedStartDate && (
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                    Início da mentoria
                  </p>
                  <p className="text-sm text-fg">{formattedStartDate}</p>
                </div>
              </div>
            )}
            {formattedEndDate && (
              <div className="flex items-start gap-2">
                <CalendarCheck2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                    Fim previsto
                  </p>
                  <p className="text-sm text-fg">{formattedEndDate}</p>
                  {student.cycle_notes && (
                    <p className="mt-0.5 text-xs text-fg-muted">{student.cycle_notes}</p>
                  )}
                </div>
              </div>
            )}
            {student.main_goal && (
              <div className="flex items-start gap-2">
                <Target className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                    Objetivo principal
                  </p>
                  <p className="text-sm text-fg">{student.main_goal}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {(student.business_type || student.business_area || student.current_clients || student.biggest_challenge) && (
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
            {student.business_type && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Tipo de negócio</p>
                <p className="text-sm text-fg">{BUSINESS_TYPE_LABELS[student.business_type]}</p>
              </div>
            )}
            {student.business_area && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Área de atuação</p>
                <p className="text-sm text-fg">{student.business_area}</p>
              </div>
            )}
            {student.current_clients && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Nº de clientes</p>
                <p className="text-sm text-fg">{student.current_clients}</p>
              </div>
            )}
            {student.biggest_challenge && (
              <div className="col-span-2 sm:col-span-4">
                <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Maior desafio atual</p>
                <p className="text-sm text-fg">{student.biggest_challenge}</p>
              </div>
            )}
          </div>
        )}

        {settings?.sla && (
          <div className="flex items-start gap-2 border-t border-border pt-4">
            <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                Como comunicamos
              </p>
              <p className="whitespace-pre-wrap text-sm text-fg">{settings.sla}</p>
            </div>
          </div>
        )}

        <p className="border-t border-border pt-4 text-sm italic text-fg-muted">
          &ldquo;{settings?.quote ?? DEFAULT_INTRO_QUOTE}&rdquo;
        </p>
      </div>
    </div>
  )
}
