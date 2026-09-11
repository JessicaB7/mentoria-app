import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { ModuleGrid, type ModuleWithLessons } from '@/routes/student/components/ModuleGrid'

export function StudentRecordedContent() {
  const { profile } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['student-recorded-content', profile?.id],
    queryFn: async () => {
      const [
        { data: modules, error: modulesError },
        { data: progress, error: progressError },
      ] = await Promise.all([
        supabase
          .from('modules')
          .select('*, lessons(*)')
          .eq('published', true)
          .order('position', { ascending: true }),
        supabase.from('lesson_progress').select('*').eq('student_id', profile!.id),
      ])
      if (modulesError) throw modulesError
      if (progressError) throw progressError

      const modulesTyped = (modules ?? []) as unknown as ModuleWithLessons[]
      const completedIds = new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id))
      return { modules: modulesTyped, completedIds }
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

  const totalLessons = data.modules.reduce((acc, m) => acc + m.lessons.filter((l) => l.published).length, 0)
  const completedCount = data.modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.published && data.completedIds.has(l.id)).length,
    0,
  )
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-fg">Conteúdo gravado</h1>
        <p className="text-sm text-fg-muted">Bem-vindo(a), {profile?.full_name}.</p>
      </div>

      {totalLessons > 0 && (
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <Progress value={pct} className="max-w-xs" />
            <span className="whitespace-nowrap text-sm text-fg-muted">
              {completedCount} de {totalLessons} aulas concluídas ({pct}%)
            </span>
          </CardContent>
        </Card>
      )}

      {data.modules.length > 0 ? (
        <ModuleGrid modules={data.modules} completedIds={data.completedIds} />
      ) : (
        <p className="text-sm text-fg-muted">Ainda não há módulos publicados.</p>
      )}
    </div>
  )
}
