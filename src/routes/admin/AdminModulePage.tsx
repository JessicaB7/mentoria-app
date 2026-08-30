import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getPublicUrl } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { ModuleDialog } from '@/routes/admin/components/ModuleDialog'
import { LessonDialog } from '@/routes/admin/components/LessonDialog'
import type { Lesson, Module } from '@/types/database'

type ModuleWithLessons = Module & { lessons: Lesson[] }

export function AdminModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const queryClient = useQueryClient()
  const [moduleDialogOpen, setModuleDialogOpen] = React.useState(false)
  const [lessonDialog, setLessonDialog] = React.useState<{ open: boolean; lesson: Lesson | null }>({
    open: false,
    lesson: null,
  })

  const { data: module, isLoading } = useQuery({
    queryKey: ['admin-module', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .eq('id', moduleId!)
        .single()
      if (error) throw error
      const typed = data as unknown as ModuleWithLessons
      typed.lessons.sort((a, b) => a.position - b.position)
      return typed
    },
    enabled: !!moduleId,
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['admin-module', moduleId] })
    queryClient.invalidateQueries({ queryKey: ['admin-modules'] })
  }

  async function deleteLesson(lesson: Lesson) {
    if (!confirm(`Eliminar a aula "${lesson.title}"?`)) return
    const { error } = await supabase.from('lessons').delete().eq('id', lesson.id)
    if (error) {
      toast.error('Não foi possível eliminar a aula.')
      return
    }
    toast.success('Aula eliminada.')
    refresh()
  }

  async function toggleLessonPublished(lesson: Lesson) {
    await supabase.from('lessons').update({ published: !lesson.published }).eq('id', lesson.id)
    refresh()
  }

  if (isLoading || !module) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/admin" className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Voltar aos módulos
      </Link>

      {module.cover_path && (
        <img
          src={getPublicUrl('module-covers', module.cover_path)}
          alt=""
          className="aspect-video w-full rounded-lg object-cover"
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-fg">{module.title}</h1>
          {module.description && <p className="text-sm text-fg-muted">{module.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setModuleDialogOpen(true)}>
            <Pencil className="size-4" />
            Editar módulo
          </Button>
          <Button size="sm" onClick={() => setLessonDialog({ open: true, lesson: null })}>
            <Plus className="size-4" />
            Aula
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {module.lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm text-fg">{lesson.title}</span>
                {!lesson.published && <Badge variant="outline">Rascunho</Badge>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Switch checked={lesson.published} onCheckedChange={() => toggleLessonPublished(lesson)} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLessonDialog({ open: true, lesson })}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteLesson(lesson)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {module.lessons.length === 0 && (
            <p className="px-4 py-6 text-sm text-fg-muted">Sem aulas neste módulo ainda.</p>
          )}
        </CardContent>
      </Card>

      <ModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        module={module}
        nextPosition={0}
        onSaved={refresh}
      />
      <LessonDialog
        open={lessonDialog.open}
        onOpenChange={(open) => setLessonDialog((s) => ({ ...s, open }))}
        moduleId={module.id}
        category="modulo"
        lesson={lessonDialog.lesson}
        nextPosition={module.lessons.length}
        onSaved={refresh}
      />
    </div>
  )
}
