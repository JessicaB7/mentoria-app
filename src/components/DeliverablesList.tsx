import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { StudentDeliverable } from '@/types/database'

export function DeliverablesList({
  studentId,
  canAdd,
  canReview,
}: {
  studentId: string
  canAdd: boolean
  canReview: boolean
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [adding, setAdding] = React.useState(false)

  const { data: deliverables, isLoading } = useQuery({
    queryKey: ['student-deliverables', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_deliverables')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as StudentDeliverable[]
    },
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['student-deliverables', studentId] })
  }

  async function addDeliverable() {
    if (!title.trim() || !url.trim()) return
    setAdding(true)
    const { error } = await supabase.from('student_deliverables').insert({
      student_id: studentId,
      title: title.trim(),
      url: url.trim(),
    })
    setAdding(false)
    if (error) {
      toast.error('Não foi possível adicionar.')
      return
    }
    setTitle('')
    setUrl('')
    refresh()
  }

  async function markReviewed(item: StudentDeliverable) {
    await supabase
      .from('student_deliverables')
      .update({ status: item.status === 'revisto' ? 'em_analise' : 'revisto' })
      .eq('id', item.id)
    refresh()
  }

  async function removeDeliverable(item: StudentDeliverable) {
    await supabase.from('student_deliverables').delete().eq('id', item.id)
    refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Espaço de trabalho</CardTitle>
        <p className="text-xs text-fg-muted">
          {canAdd
            ? 'Partilha aqui links do que fores trabalhando — documentos, propostas, o que fizer sentido.'
            : 'O que o aluno partilhou do trabalho em curso.'}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {canAdd && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addDeliverable}
              disabled={adding || !title.trim() || !url.trim()}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        )}
        <div className="flex flex-col divide-y divide-border">
          {(deliverables ?? []).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-2.5">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-1.5 text-sm text-fg hover:underline"
              >
                <ExternalLink className="size-3.5 shrink-0 text-fg-muted" />
                <span className="truncate">{item.title}</span>
              </a>
              <div className="flex shrink-0 items-center gap-2">
                {canReview ? (
                  <button onClick={() => markReviewed(item)}>
                    <Badge variant={item.status === 'revisto' ? 'success' : 'outline'}>
                      {item.status === 'revisto' ? 'Revisto' : 'Em análise'}
                    </Badge>
                  </button>
                ) : (
                  <Badge variant={item.status === 'revisto' ? 'success' : 'outline'}>
                    {item.status === 'revisto' ? 'Revisto' : 'Em análise'}
                  </Badge>
                )}
                {canAdd && (
                  <button
                    onClick={() => removeDeliverable(item)}
                    className="text-fg-muted hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!isLoading && (deliverables ?? []).length === 0 && (
            <p className="py-3 text-sm text-fg-muted">Ainda não há nada aqui.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
