import { CalendarDays, Target } from 'lucide-react'
import type { Profile } from '@/types/database'

const INSPIRATIONAL_QUOTE =
  'Grandes negócios não nascem de grandes saltos — nascem de pequenos passos consistentes, sessão após sessão.'

export function IndividualIntro({ student }: { student: Profile }) {
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
      <div className="flex flex-col gap-4 pl-2">
        <p className="text-sm leading-relaxed text-fg">
          Este é o teu espaço de <strong className="text-primary">acompanhamento individual</strong> —
          sessões 1:1 pensadas exclusivamente para o teu negócio e para os desafios do teu dia a dia
          como contabilista.
          <br />
          <br />
          Aqui vais encontrar cada sessão, com o resumo, os materiais partilhados e os próximos passos
          combinados. Antes do próximo encontro, vale a pena rever a sessão anterior para chegares com
          tudo fresco.
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
          &ldquo;{INSPIRATIONAL_QUOTE}&rdquo;
        </p>
      </div>
    </div>
  )
}
