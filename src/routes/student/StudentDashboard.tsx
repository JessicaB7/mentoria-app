import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getPublicUrl } from '@/lib/storage'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import type { Lesson, Module } from '@/types/database'

type ModuleWithLessons = Module & { lessons: Lesson[] }

function ModuleGrid({
  modules,
  completedIds,
}: {
  modules: ModuleWithLessons[]
  completedIds: Set<string>
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((module) => {
        const publishedLessons = module.lessons.filter((l) => l.published)
        const moduleCompleted = publishedLessons.filter((l) => completedIds.has(l.id)).length

        return (
          <Link key={module.id} to={`/aluno/modulos/${module.id}`}>
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
              <CardHeader>
                <CardTitle className="text-base">{module.title}</CardTitle>
                {module.description && <CardDescription>{module.description}</CardDescription>}
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-fg-muted">
                  {publishedLessons.length === 0
                    ? 'Sem aulas ainda'
                    : `${moduleCompleted} de ${publishedLessons.length} aulas concluídas`}
                </p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function LessonList({ lessons, completedIds }: { lessons: Lesson[]; completedIds: Set<string> }) {
  return (
    <Card>
      <CardContent className="flex flex-col divide-y divide-border p-0">
        {lessons.map((lesson) => {
          const done = completedIds.has(lesson.id)
          return (
            <Link
              key={lesson.id}
              to={`/aluno/aulas/${lesson.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-border/20"
            >
              {done ? (
                <CheckCircle2 className="size-5 shrink-0 text-success" />
              ) : (
                <Circle className="size-5 shrink-0 text-fg-muted" />
              )}
              <PlayCircle className="size-4 shrink-0 text-fg-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{lesson.title}</p>
                {lesson.duration_minutes && (
                  <p className="text-xs text-fg-muted">{lesson.duration_minutes} min</p>
                )}
              </div>
            </Link>
          )
        })}
        {lessons.length === 0 && <p className="px-4 py-6 text-sm text-fg-muted">Sem aulas por aqui ainda.</p>}
      </CardContent>
    </Card>
  )
}

export function StudentDashboard() {
  const { profile } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['student-modules', profile?.id],
    queryFn: async () => {
      const [
        { data: modules, error: modulesError },
        { data: flatLessons, error: lessonsError },
        { data: progress, error: progressError },
      ] = await Promise.all([
        supabase
          .from('modules')
          .select('*, lessons(*)')
          .eq('published', true)
          .order('position', { ascending: true }),
        supabase.from('lessons').select('*').in('category', ['ao_vivo', 'individual']).order('position', {
          ascending: true,
        }),
        supabase.from('lesson_progress').select('*').eq('student_id', profile!.id),
      ])
      if (modulesError) throw modulesError
      if (lessonsError) throw lessonsError
      if (progressError) throw progressError

      const modulesTyped = (modules ?? []) as unknown as ModuleWithLessons[]
      const lessonsTyped = (flatLessons ?? []) as Lesson[]
      const completedIds = new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id))
      return { modules: modulesTyped, lessons: lessonsTyped, completedIds }
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

  const aoVivoLessons = data.lessons.filter((l) => l.category === 'ao_vivo')
  const individualLessons = data.lessons.filter((l) => l.category === 'individual')

  const totalLessons =
    data.modules.reduce((acc, m) => acc + m.lessons.length, 0) + aoVivoLessons.length + individualLessons.length
  const completedCount = data.completedIds.size
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const hasAnything = data.modules.length > 0 || aoVivoLessons.length > 0 || individualLessons.length > 0

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-fg">As tuas aulas</h1>
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

      {!hasAnything && <p className="text-sm text-fg-muted">Ainda não há aulas publicadas.</p>}

      {aoVivoLessons.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">Aulas ao vivo</h2>
          <LessonList lessons={aoVivoLessons} completedIds={data.completedIds} />
        </div>
      )}

      {individualLessons.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Acompanhamento individual
          </h2>
          <LessonList lessons={individualLessons} completedIds={data.completedIds} />
        </div>
      )}

      {data.modules.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Módulos gravados
          </h2>
          <ModuleGrid modules={data.modules} completedIds={data.completedIds} />
        </div>
      )}
    </div>
  )
}
