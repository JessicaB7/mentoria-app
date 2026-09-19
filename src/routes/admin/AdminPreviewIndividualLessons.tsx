import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/spinner'
import { IndividualIntro } from '@/components/IndividualIntro'
import { SchedulingEmbed } from '@/components/SchedulingEmbed'
import { GoalList } from '@/components/GoalList'
import { DeliverablesList } from '@/components/DeliverablesList'
import { LessonList } from '@/routes/student/components/LessonList'
import type { Lesson, Profile } from '@/types/database'

export function AdminPreviewIndividualLessons() {
  const { studentId } = useParams<{ studentId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-preview-individual', studentId],
    queryFn: async () => {
      const [
        { data: student, error: studentError },
        { data: lessons, error: lessonsError },
        { data: progress, error: progressError },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', studentId!).single(),
        supabase
          .from('lessons')
          .select('*')
          .eq('category', 'individual')
          .eq('published', true)
          .or(`student_id.eq.${studentId},student_id.is.null`)
          .order('position', { ascending: true }),
        supabase.from('lesson_progress').select('*').eq('student_id', studentId!),
      ])
      if (studentError) throw studentError
      if (lessonsError) throw lessonsError
      if (progressError) throw progressError

      const completedIds = new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id))
      return { student: student as Profile, lessons: (lessons ?? []) as Lesson[], completedIds }
    },
    enabled: !!studentId,
  })

  if (isLoading || !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/admin/individual/${studentId}`}
        className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Voltar à gestão das aulas
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-fg">Acompanhamento individual</h1>
        <p className="text-sm text-fg-muted">A ver como {data.student.full_name} vê esta secção.</p>
      </div>

      <IndividualIntro student={data.student} />

      <GoalList studentId={data.student.id} canManage={false} />

      <LessonList
        lessons={data.lessons}
        completedIds={data.completedIds}
        emptyLabel="Ainda não há aulas publicadas para este aluno."
        linkBase={`/admin/individual/${studentId}/aulas`}
      />

      <SchedulingEmbed />

      <DeliverablesList studentId={data.student.id} canAdd={false} canReview={false} />
    </div>
  )
}
