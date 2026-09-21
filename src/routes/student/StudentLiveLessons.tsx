import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/spinner'
import { LessonList } from '@/routes/student/components/LessonList'
import { NextLiveSessionBanner } from '@/components/NextLiveSessionBanner'
import type { Lesson } from '@/types/database'

export function StudentLiveLessons() {
  const { profile } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['student-live-lessons', profile?.id],
    queryFn: async () => {
      const [{ data: lessons, error: lessonsError }, { data: progress, error: progressError }] =
        await Promise.all([
          supabase
            .from('lessons')
            .select('*')
            .eq('category', 'ao_vivo')
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
        <h1 className="text-xl font-semibold text-fg">Aula ao vivo</h1>
        <p className="text-sm text-fg-muted">Hot Seats e outras sessões em grupo ao vivo.</p>
      </div>
      <NextLiveSessionBanner lessons={data.lessons} />
      <LessonList
        lessons={data.lessons}
        completedIds={data.completedIds}
        emptyLabel="Ainda não há aulas ao vivo publicadas."
      />
    </div>
  )
}
