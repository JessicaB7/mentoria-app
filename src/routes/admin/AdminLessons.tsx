import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getPublicUrl } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { ModuleDialog } from '@/routes/admin/components/ModuleDialog'
import { LessonDialog } from '@/routes/admin/components/LessonDialog'
import type { Lesson, Module, ModuleCategory, Profile } from '@/types/database'

type ModuleWithLessons = Module & { lessons: Lesson[] }
type LessonWithStudent = Lesson & { profiles: Pick<Profile, 'id' | 'full_name' | 'email'> | null }

function ModuleCardGrid({
  modules,
  onEdit,
  onDelete,
}: {
  modules: ModuleWithLessons[]
  onEdit: (e: React.MouseEvent, module: Module) => void
  onDelete: (e: React.MouseEvent, module: Module) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((module) => (
        <Link key={module.id} to={`/admin/modulos/${module.id}`}>
          <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
            {module.cover_path ? (
              <img
                src={getPublicUrl('module-covers', module.cover_path)}
                alt=""
                className="aspect-video w-full object-cover"
              />
            ) : (
              <div className="aspect-video w-full bg-border" />
            )}
            <CardHeader className="flex-row items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base">{module.title}</CardTitle>
                {module.description && <CardDescription>{module.description}</CardDescription>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" onClick={(e) => onEdit(e, module)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => onDelete(e, module)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-fg-muted">
                {module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}
                {!module.published && ' · Rascunho'}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function LessonList({
  lessons,
  showStudent,
  onEdit,
  onDelete,
  onTogglePublished,
}: {
  lessons: LessonWithStudent[]
  showStudent: boolean
  onEdit: (lesson: Lesson) => void
  onDelete: (lesson: Lesson) => void
  onTogglePublished: (lesson: Lesson) => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-col divide-y divide-border p-0">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm text-fg">{lesson.title}</span>
              {!lesson.published && <Badge variant="outline">Rascunho</Badge>}
              {showStudent && (
                <Badge variant="outline">{lesson.profiles ? lesson.profiles.full_name : 'Sem aluno'}</Badge>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Switch checked={lesson.published} onCheckedChange={() => onTogglePublished(lesson)} />
              <Button variant="ghost" size="icon" onClick={() => onEdit(lesson)}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(lesson)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {lessons.length === 0 && <p className="px-4 py-6 text-sm text-fg-muted">Sem aulas nesta categoria ainda.</p>}
      </CardContent>
    </Card>
  )
}

export function AdminLessons() {
  const queryClient = useQueryClient()
  const [moduleDialogOpen, setModuleDialogOpen] = React.useState(false)
  const [editingModule, setEditingModule] = React.useState<Module | null>(null)
  const [lessonDialog, setLessonDialog] = React.useState<{
    open: boolean
    lesson: Lesson | null
    category: ModuleCategory
  }>({ open: false, lesson: null, category: 'ao_vivo' })

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .order('position', { ascending: true })
      if (error) throw error
      const typed = data as unknown as ModuleWithLessons[]
      typed.forEach((m) => m.lessons.sort((a, b) => a.position - b.position))
      return typed
    },
  })

  const { data: flatLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*, profiles(id, full_name, email)')
        .in('category', ['ao_vivo', 'individual'])
        .order('position', { ascending: true })
      if (error) throw error
      return data as unknown as LessonWithStudent[]
    },
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['admin-modules'] })
    queryClient.invalidateQueries({ queryKey: ['admin-lessons'] })
  }

  async function deleteModule(e: React.MouseEvent, module: Module) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Eliminar o módulo "${module.title}" e todas as suas aulas?`)) return
    const { error } = await supabase.from('modules').delete().eq('id', module.id)
    if (error) {
      toast.error('Não foi possível eliminar o módulo.')
      return
    }
    toast.success('Módulo eliminado.')
    refresh()
  }

  function editModule(e: React.MouseEvent, module: Module) {
    e.preventDefault()
    e.stopPropagation()
    setEditingModule(module)
    setModuleDialogOpen(true)
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

  if (modulesLoading || lessonsLoading || !modules || !flatLessons) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  const aoVivoLessons = flatLessons.filter((l) => l.category === 'ao_vivo')
  const individualLessons = flatLessons.filter((l) => l.category === 'individual')

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Aulas</h1>
          <p className="text-sm text-fg-muted">Vista do mentor.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">Aulas ao vivo</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLessonDialog({ open: true, lesson: null, category: 'ao_vivo' })}
          >
            <Plus className="size-4" />
            Nova aula
          </Button>
        </div>
        <LessonList
          lessons={aoVivoLessons}
          showStudent={false}
          onEdit={(lesson) => setLessonDialog({ open: true, lesson, category: 'ao_vivo' })}
          onDelete={deleteLesson}
          onTogglePublished={toggleLessonPublished}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Acompanhamento individual
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLessonDialog({ open: true, lesson: null, category: 'individual' })}
          >
            <Plus className="size-4" />
            Nova aula
          </Button>
        </div>
        <LessonList
          lessons={individualLessons}
          showStudent
          onEdit={(lesson) => setLessonDialog({ open: true, lesson, category: 'individual' })}
          onDelete={deleteLesson}
          onTogglePublished={toggleLessonPublished}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Módulos gravados
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setEditingModule(null)
              setModuleDialogOpen(true)
            }}
          >
            <Plus className="size-4" />
            Novo módulo
          </Button>
        </div>
        {modules.length > 0 ? (
          <ModuleCardGrid modules={modules} onEdit={editModule} onDelete={deleteModule} />
        ) : (
          <p className="text-sm text-fg-muted">Ainda não criaste nenhum módulo.</p>
        )}
      </div>

      <ModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        module={editingModule}
        nextPosition={modules.length}
        onSaved={refresh}
      />
      <LessonDialog
        open={lessonDialog.open}
        onOpenChange={(open) => setLessonDialog((s) => ({ ...s, open }))}
        moduleId={null}
        category={lessonDialog.category}
        lesson={lessonDialog.lesson}
        nextPosition={
          lessonDialog.category === 'ao_vivo' ? aoVivoLessons.length : individualLessons.length
        }
        onSaved={refresh}
      />
    </div>
  )
}
