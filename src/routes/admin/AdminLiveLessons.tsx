import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LessonDialog } from '@/routes/admin/components/LessonDialog'
import { LessonList, type LessonWithStudent } from '@/routes/admin/components/LessonList'
import type { Lesson } from '@/types/database'

export function AdminLiveLessons() {
  const queryClient = useQueryClient()
  const [lessonDialog, setLessonDialog] = React.useState<{ open: boolean; lesson: Lesson | null }>({
    open: false,
    lesson: null,
  })

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['admin-live-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*, profiles(id, full_name, email)')
        .eq('category', 'ao_vivo')
        .order('position', { ascending: true })
      if (error) throw error
      return data as unknown as LessonWithStudent[]
    },
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['admin-live-lessons'] })
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

  if (isLoading || !lessons) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Aula ao vivo</h1>
          <p className="text-sm text-fg-muted">Hot Seats e outras sessões em grupo ao vivo.</p>
        </div>
        <Button onClick={() => setLessonDialog({ open: true, lesson: null })}>
          <Plus className="size-4" />
          Nova aula
        </Button>
      </div>

      <LessonList
        lessons={lessons}
        showStudent={false}
        emptyLabel="Sem aulas ao vivo ainda."
        onEdit={(lesson) => setLessonDialog({ open: true, lesson })}
        onDelete={deleteLesson}
        onTogglePublished={toggleLessonPublished}
      />

      <LessonDialog
        open={lessonDialog.open}
        onOpenChange={(open) => setLessonDialog((s) => ({ ...s, open }))}
        moduleId={null}
        category="ao_vivo"
        lesson={lessonDialog.lesson}
        nextPosition={lessons.length}
        onSaved={refresh}
      />
    </div>
  )
}
