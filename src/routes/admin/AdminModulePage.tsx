import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Paperclip, Pencil, Plus, Trash2, Video, VideoOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ModuleHeader, ModuleObjective } from '@/components/ModuleHeader'
import { lessonNumber } from '@/lib/modules'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { ModuleDialog } from '@/routes/admin/components/ModuleDialog'
import { LessonDialog } from '@/routes/admin/components/LessonDialog'
import type { Lesson, Module } from '@/types/database'

type ModuleWithLessons = Module & { lessons: (Lesson & { materials: { id: string }[] })[] }

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
        .select('*, lessons(*, materials(id))')
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link to="/admin/gravado/aulas" className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Voltar aos módulos
      </Link>

      <ModuleHeader
        module={module}
        lessons={module.lessons.filter((l) => l.published)}
        actions={
          <div className="mt-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setModuleDialogOpen(true)}>
              <Pencil className="size-4" />
              Editar módulo
            </Button>
            <Button size="sm" onClick={() => setLessonDialog({ open: true, lesson: null })}>
              <Plus className="size-4" />
              Aula
            </Button>
          </div>
        }
      />

      <ModuleObjective module={module} />

      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-fg-muted">Aulas</h2>

      <Card>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {module.lessons.map((lesson, index) => (
            <div key={lesson.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-border/40 text-xs font-semibold text-fg-muted">
                  {lessonNumber(module.title, index)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-fg">{lesson.title}</span>
                    {!lesson.published && <Badge variant="outline">Rascunho</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-fg-muted">
                    {lesson.external_url ? (
                      <a
                        href={lesson.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-fg"
                      >
                        <ExternalLink className="size-3" /> Link
                      </a>
                    ) : lesson.video_path ? (
                      <span className="flex items-center gap-1">
                        <Video className="size-3" /> Vídeo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-warning">
                        <VideoOff className="size-3" /> Sem vídeo nem link
                      </span>
                    )}
                    {lesson.duration_minutes && <span>{lesson.duration_minutes} min</span>}
                    {lesson.materials.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip className="size-3" />
                        {lesson.materials.length} {lesson.materials.length === 1 ? 'material' : 'materiais'}
                      </span>
                    )}
                  </div>
                </div>
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
