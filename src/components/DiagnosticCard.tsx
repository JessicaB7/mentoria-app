import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/types/database'

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-fg">{value}</p>
    </div>
  )
}

export function DiagnosticCard({ student }: { student: Profile }) {
  const hasAnything =
    student.current_services ||
    (student.challenges && student.challenges.length > 0) ||
    student.other_challenges ||
    student.enrollment_reason ||
    student.success_definition ||
    student.learning_goals ||
    student.additional_notes

  if (!hasAnything) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Diagnóstico inicial</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field label="Serviços atuais" value={student.current_services} />
        {student.challenges && student.challenges.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
              Maiores desafios
            </p>
            <div className="flex flex-wrap gap-1.5">
              {student.challenges.map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Field label="Outros desafios" value={student.other_challenges} />
        <Field label="Motivos de inscrição" value={student.enrollment_reason} />
        <Field label="Definição de sucesso" value={student.success_definition} />
        <Field label="O que gostaria de aprender" value={student.learning_goals} />
        <Field label="Notas adicionais" value={student.additional_notes} />
      </CardContent>
    </Card>
  )
}
