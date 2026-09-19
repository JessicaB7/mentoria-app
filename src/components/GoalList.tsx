import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { GoalStatus, StudentGoal } from '@/types/database'

const STATUS_LABELS: Record<GoalStatus, string> = {
  por_comecar: 'Por começar',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}

export function GoalList({ studentId, canManage }: { studentId: string; canManage: boolean }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = React.useState('')
  const [dueDate, setDueDate] = React.useState('')
  const [adding, setAdding] = React.useState(false)

  const { data: goals, isLoading } = useQuery({
    queryKey: ['student-goals', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_goals')
        .select('*')
        .eq('student_id', studentId)
        .order('position', { ascending: true })
      if (error) throw error
      return data as StudentGoal[]
    },
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['student-goals', studentId] })
  }

  async function addGoal() {
    if (!title.trim()) return
    setAdding(true)
    const { error } = await supabase.from('student_goals').insert({
      student_id: studentId,
      title: title.trim(),
      due_date: dueDate || null,
      position: goals?.length ?? 0,
    })
    setAdding(false)
    if (error) {
      toast.error('Não foi possível adicionar o objetivo.')
      return
    }
    setTitle('')
    setDueDate('')
    refresh()
  }

  async function updateStatus(goal: StudentGoal, status: GoalStatus) {
    const { error } = await supabase.from('student_goals').update({ status }).eq('id', goal.id)
    if (error) {
      toast.error('Não foi possível atualizar o estado.')
      return
    }
    refresh()
  }

  async function deleteGoal(goal: StudentGoal) {
    await supabase.from('student_goals').delete().eq('id', goal.id)
    refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Plano de ação</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {canManage && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Novo objetivo…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                type="date"
                className="w-40"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={addGoal} disabled={adding || !title.trim()}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        )}
        <div className="flex flex-col divide-y divide-border">
          {(goals ?? []).map((goal) => (
            <div key={goal.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-fg">{goal.title}</p>
                {goal.due_date && (
                  <p className="text-xs text-fg-muted">
                    Prazo: {new Date(`${goal.due_date}T00:00:00`).toLocaleDateString('pt-PT')}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Select value={goal.status} onValueChange={(v) => updateStatus(goal, v as GoalStatus)}>
                  <SelectTrigger className="h-8 w-[9.5rem] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(STATUS_LABELS) as [GoalStatus, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {canManage && (
                  <button
                    onClick={() => deleteGoal(goal)}
                    className="text-fg-muted hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!isLoading && (goals ?? []).length === 0 && (
            <p className="py-3 text-sm text-fg-muted">
              {canManage ? 'Ainda não há objetivos definidos.' : 'O teu mentor ainda não definiu objetivos aqui.'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
