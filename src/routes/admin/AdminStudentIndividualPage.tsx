import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Eye, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LessonDialog } from '@/routes/admin/components/LessonDialog'
import { LessonList, type LessonWithStudent } from '@/routes/admin/components/LessonList'
import type { Lesson, Profile } from '@/types/database'

export function AdminStudentIndividualPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const queryClient = useQueryClient()
  const [lessonDialog, setLessonDialog] = React.useState<{ open: boolean; lesson: Lesson | null }>({
    open: false,
    lesson: null,
  })

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', studentId!).single()
      if (error) throw error
      return data as Profile
    },
    enabled: !!studentId,
  })

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin-student-individual-lessons', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*, profiles(id, full_name, email)')
        .eq('category', 'individual')
        .eq('student_id', studentId!)
        .order('position', { ascending: true })
      if (error) throw error
      return data as unknown as LessonWithStudent[]
    },
    enabled: !!studentId,
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['admin-student-individual-lessons', studentId] })
    queryClient.invalidateQueries({ queryKey: ['admin-individual-lessons'] })
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

  if (studentLoading || lessonsLoading || !student || !lessons) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/admin/individual"
        className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Voltar ao acompanhamento individual
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-fg">{student.full_name}</h1>
          <p className="text-sm text-fg-muted">{student.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/admin/individual/${studentId}/preview`}>
              <Eye className="size-4" />
              Ver como aluno
            </Link>
          </Button>
          <Button size="sm" onClick={() => setLessonDialog({ open: true, lesson: null })}>
            <Plus className="size-4" />
            Nova aula
          </Button>
        </div>
      </div>

      <LessonList
        lessons={lessons}
        showStudent={false}
        emptyLabel="Ainda não há aulas individuais para este aluno."
        onEdit={(lesson) => setLessonDialog({ open: true, lesson })}
        onDelete={deleteLesson}
        onTogglePublished={toggleLessonPublished}
      />

      <LessonDialog
        open={lessonDialog.open}
        onOpenChange={(open) => setLessonDialog((s) => ({ ...s, open }))}
        moduleId={null}
        category="individual"
        lesson={lessonDialog.lesson}
        nextPosition={lessons.length}
        onSaved={refresh}
        defaultStudentId={studentId}
      />
    </div>
  )
}
