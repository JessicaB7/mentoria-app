import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Pencil, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { renderRichText } from '@/lib/richText'
import type { AppSetting, Profile } from '@/types/database'

const DEFAULT_INTRO_TEXT =
  'Este é o teu espaço de **acompanhamento individual** — sessões 1:1 pensadas exclusivamente para o teu negócio e para os desafios do teu dia a dia como contabilista.\n\nAqui vais encontrar cada sessão, com o resumo, os materiais partilhados e os próximos passos combinados. Antes do próximo encontro, vale a pena rever a sessão anterior para chegares com tudo fresco.'

const DEFAULT_INTRO_QUOTE =
  'Grandes negócios não nascem de grandes saltos — nascem de pequenos passos consistentes, sessão após sessão.'

export function useIndividualIntroSettings() {
  return useQuery({
    queryKey: ['individual-intro-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .in('key', ['individual_intro_text', 'individual_intro_quote'])
      if (error) throw error
      const rows = (data ?? []) as AppSetting[]
      const byKey = new Map(rows.map((r) => [r.key, r.value]))
      return {
        text: byKey.get('individual_intro_text') || DEFAULT_INTRO_TEXT,
        quote: byKey.get('individual_intro_quote') || DEFAULT_INTRO_QUOTE,
      }
    },
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

  const formattedStartDate = student.start_date
    ? new Date(student.start_date + 'T00:00:00').toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

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

        {(formattedStartDate || student.main_goal) && (
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

        <p className="border-t border-border pt-4 text-sm italic text-fg-muted">
          &ldquo;{settings?.quote ?? DEFAULT_INTRO_QUOTE}&rdquo;
        </p>
      </div>
    </div>
  )
}
