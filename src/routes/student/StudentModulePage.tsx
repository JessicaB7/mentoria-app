import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, PlayCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getPublicUrl } from '@/lib/storage'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import type { Lesson, Module } from '@/types/database'

type ModuleWithLessons = Module & { lessons: Lesson[] }

export function StudentModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const { profile } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['student-module', moduleId, profile?.id],
    queryFn: async () => {
      const [{ data: module, error: moduleError }, { data: progress, error: progressError }] =
        await Promise.all([
          supabase.from('modules').select('*, lessons(*)').eq('id', moduleId!).single(),
          supabase.from('lesson_progress').select('*').eq('student_id', profile!.id),
        ])
      if (moduleError) throw moduleError
      if (progressError) throw progressError

      const moduleTyped = module as unknown as ModuleWithLessons
      const completedIds = new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id))
      return { module: moduleTyped, completedIds }
    },
    enabled: !!moduleId && !!profile,
  })

  if (isLoading || !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  const { module, completedIds } = data
  const lessons = module.lessons.filter((l) => l.published).sort((a, b) => a.position - b.position)

  return (
    <div className="flex flex-col gap-4">
      <Link to="/aluno" className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Voltar aos módulos
      </Link>

      {module.cover_path && (
        <img
          src={getPublicUrl('module-covers', module.cover_path)}
          alt=""
          className="aspect-video w-full rounded-lg object-cover"
        />
      )}

      <div>
        <h1 className="text-xl font-semibold text-fg">{module.title}</h1>
        {module.description && <p className="text-sm text-fg-muted">{module.description}</p>}
      </div>

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
          {lessons.length === 0 && (
            <p className="px-4 py-6 text-sm text-fg-muted">Sem aulas neste módulo ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
