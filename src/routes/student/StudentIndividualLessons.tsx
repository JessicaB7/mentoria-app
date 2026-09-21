import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle, ClipboardList } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/spinner'
import { IndividualIntro } from '@/components/IndividualIntro'
import { SchedulingEmbed } from '@/components/SchedulingEmbed'
import { GoalList } from '@/components/GoalList'
import { DeliverablesList } from '@/components/DeliverablesList'
import { FeedbackForm } from '@/components/FeedbackForm'
import { LessonList } from '@/routes/student/components/LessonList'
import type { Lesson, Profile } from '@/types/database'

function hasCheckIn(profile: Profile) {
  return Boolean(
    profile.current_services ||
      (profile.challenges && profile.challenges.length > 0) ||
      profile.other_challenges ||
      profile.enrollment_reason ||
      profile.success_definition ||
      profile.learning_goals ||
      profile.additional_notes,
  )
}

export function StudentIndividualLessons() {
  const { profile } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['student-individual-lessons', profile?.id],
    queryFn: async () => {
      const [{ data: lessons, error: lessonsError }, { data: progress, error: progressError }] =
        await Promise.all([
          supabase
            .from('lessons')
            .select('*')
            .eq('category', 'individual')
            .eq('published', true)
            .order('position', { ascending: true }),
          supabase.from('lesson_progress').select('*').eq('student_id', profile!.id),
        ])
      if (lessonsError) throw lessonsError
      if (progressError) throw progressError

      const completedIds = new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id))
      return { lessons: (lessons ?? []) as Lesson[], completedIds }
    },
    enabled: !!profile,
  })

  if (isLoading || !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Acompanhamento individual</h1>
        <p className="text-sm text-fg-muted">
          Regras gerais e as sessões 1:1 dedicadas a ti.
        </p>
      </div>
      {profile && <IndividualIntro student={profile} />}
      <LessonList
        lessons={data.lessons}
        completedIds={data.completedIds}
        emptyLabel="Ainda não há nada por aqui."
        leadingItem={
          profile && (
            <Link
              to="/aluno/check-in"
              className="flex items-center gap-3 px-4 py-3 hover:bg-border/20"
            >
              {hasCheckIn(profile) ? (
                <CheckCircle2 className="size-5 shrink-0 text-success" />
              ) : (
                <Circle className="size-5 shrink-0 text-fg-muted" />
              )}
              <ClipboardList className="size-4 shrink-0 text-fg-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">Check-in Mentoria</p>
                <p className="text-xs text-fg-muted">O teu ponto de partida — responde antes da Sessão 1</p>
              </div>
            </Link>
          )
        }
      />
      {profile && <GoalList studentId={profile.id} canManage={false} />}
      <SchedulingEmbed />
      {profile && <DeliverablesList studentId={profile.id} canAdd canReview={false} />}
      {profile && <FeedbackForm studentId={profile.id} endDate={profile.end_date} />}
    </div>
  )
}
