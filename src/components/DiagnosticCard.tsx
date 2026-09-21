import { Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/types/database'

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</p>
      <p className={value ? 'whitespace-pre-wrap text-sm text-fg' : 'text-sm italic text-fg-muted'}>
        {value || 'Por preencher'}
      </p>
    </div>
  )
}

export function DiagnosticCard({
  student,
  editable = false,
  onEditClick,
}: {
  student: Profile
  editable?: boolean
  onEditClick?: () => void
}) {
  const hasAnything =
    student.current_services ||
    (student.challenges && student.challenges.length > 0) ||
    student.other_challenges ||
    student.enrollment_reason ||
    student.success_definition ||
    student.learning_goals ||
    student.additional_notes

  if (!editable && !hasAnything) return null

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Check-in Mentoria</CardTitle>
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
        <Field label="Serviços atuais" value={student.current_services} />
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
            Maiores desafios
          </p>
          {student.challenges && student.challenges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {student.challenges.map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-fg-muted">Por preencher</p>
          )}
        </div>
        <Field label="Outros desafios" value={student.other_challenges} />
        <Field label="Motivos de inscrição" value={student.enrollment_reason} />
        <Field label="Definição de sucesso" value={student.success_definition} />
        <Field label="O que gostaria de aprender" value={student.learning_goals} />
        <Field label="Notas adicionais" value={student.additional_notes} />
      </CardContent>
    </Card>
  )
}
