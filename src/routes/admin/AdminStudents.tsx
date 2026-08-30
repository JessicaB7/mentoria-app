import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { StudentDialog } from '@/routes/admin/components/StudentDialog'
import type { Profile } from '@/types/database'

const PAYMENT_LABELS: Record<string, string> = {
  pronto: 'Pronto pagamento',
  prestacoes: 'Prestações',
}

export function AdminStudents() {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = React.useState<{ open: boolean; student: Profile | null }>({
    open: false,
    student: null,
  })

  const { data: students, isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['admin-students'] })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">Alunos</h1>
        <Button onClick={() => setDialog({ open: true, student: null })}>
          <Plus className="size-4" />
          Novo aluno
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="size-6" />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {(students ?? []).map((student) => (
              <button
                key={student.id}
                onClick={() => setDialog({ open: true, student })}
                className="flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-border/20"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">{student.full_name}</p>
                  <p className="truncate text-xs text-fg-muted">
                    {student.email}
                    {student.phone && ` · ${student.phone}`}
                    {student.start_date && ` · início ${student.start_date}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {student.mentoria_value != null && (
                    <Badge variant="outline">{student.mentoria_value.toFixed(2)}€</Badge>
                  )}
                  {student.payment_method && (
                    <Badge variant="outline">
                      {PAYMENT_LABELS[student.payment_method]}
                      {student.payment_method === 'prestacoes' &&
                        student.installments_count &&
                        ` (${student.installments_count}x)`}
                    </Badge>
                  )}
                  <Pencil className="size-4 text-fg-muted" />
                </div>
              </button>
            ))}
            {(students ?? []).length === 0 && (
              <p className="px-4 py-6 text-sm text-fg-muted">Ainda não tens alunos registados.</p>
            )}
          </CardContent>
        </Card>
      )}

      <StudentDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
        student={dialog.student}
        onSaved={refresh}
      />
    </div>
  )
}
