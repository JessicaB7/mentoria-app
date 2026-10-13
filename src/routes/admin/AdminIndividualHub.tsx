import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronRight, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { IndividualAnalysis } from '@/components/IndividualAnalysis'
import { checkInFilledCount } from '@/lib/checkIn'
import { LessonDialog } from '@/routes/admin/components/LessonDialog'
import { LessonList, type LessonWithStudent } from '@/routes/admin/components/LessonList'
import type { Lesson, Profile } from '@/types/database'

export function AdminIndividualHub() {
  const queryClient = useQueryClient()
  const [lessonDialog, setLessonDialog] = React.useState<{ open: boolean; lesson: Lesson | null }>({
    open: false,
    lesson: null,
  })

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin-individual-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*, profiles(id, full_name, email)')
        .eq('category', 'individual')
        .order('position', { ascending: true })
      if (error) throw error
      return data as unknown as LessonWithStudent[]
    },
  })

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-lesson'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name', { ascending: true })
      if (error) throw error
      return data as Profile[]
    },
  })

  function refresh() {
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

  if (lessonsLoading || studentsLoading || !lessons || !students) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  const generalLessons = lessons.filter((l) => !l.student_id)
  const countByStudent = new Map<string, number>()
  const doneByStudent = new Map<string, number>()
  const today = new Date().toISOString().slice(0, 10)
  for (const l of lessons) {
    if (!l.student_id) continue
    countByStudent.set(l.student_id, (countByStudent.get(l.student_id) ?? 0) + 1)
    if (l.session_date && l.session_date <= today) {
      doneByStudent.set(l.student_id, (doneByStudent.get(l.student_id) ?? 0) + 1)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-fg">Acompanhamento individual</h1>
        <p className="text-sm text-fg-muted">Sessões 1:1 e conteúdo dedicado a cada aluno.</p>
      </div>

      <IndividualAnalysis students={students} lessons={lessons} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Aulas gerais · visíveis a todos os alunos
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLessonDialog({ open: true, lesson: null })}
          >
            <Plus className="size-4" />
            Nova aula
          </Button>
        </div>
        <LessonList
          lessons={generalLessons}
          showStudent={false}
          emptyLabel='Sem aulas gerais ainda (ex.: "Como agendar a tua sessão").'
          onEdit={(lesson) => setLessonDialog({ open: true, lesson })}
          onDelete={deleteLesson}
          onTogglePublished={toggleLessonPublished}
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">Por aluno</h2>
        <Card>
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {students.map((student) => (
              <Link
                key={student.id}
                to={`/admin/alunos/individual/${student.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-border/20"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{student.full_name}</p>
                  <p className="truncate text-xs text-fg-muted">{student.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {checkInFilledCount(student) === 0 && (
                    <Badge variant="warning" className="hidden sm:inline-flex">
                      Check-in por preencher
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {doneByStudent.get(student.id) ?? 0}/{countByStudent.get(student.id) ?? 0} realizadas
                  </Badge>
                  <ChevronRight className="size-4 text-fg-muted" />
                </div>
              </Link>
            ))}
            {students.length === 0 && (
              <p className="px-4 py-6 text-sm text-fg-muted">Ainda não tens alunos registados.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <LessonDialog
        open={lessonDialog.open}
        onOpenChange={(open) => setLessonDialog((s) => ({ ...s, open }))}
        moduleId={null}
        category="individual"
        lesson={lessonDialog.lesson}
        nextPosition={generalLessons.length}
        onSaved={refresh}
      />
    </div>
  )
}
