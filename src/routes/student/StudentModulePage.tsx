import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Paperclip, PlayCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ModuleHeader, ModuleObjective } from '@/components/ModuleHeader'
import { lessonNumber } from '@/lib/modules'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import type { Lesson, Module } from '@/types/database'

type LessonWithMaterials = Lesson & { materials: { id: string }[] }
type ModuleWithLessons = Module & { lessons: LessonWithMaterials[] }

// A descrição da aula usa **negrito**; na lista mostramos só o texto.
function plainText(text: string) {
  return text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
}

export function StudentModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const { profile } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['student-module', moduleId, profile?.id],
    queryFn: async () => {
      const [{ data: module, error: moduleError }, { data: progress, error: progressError }] =
        await Promise.all([
          supabase.from('modules').select('*, lessons(*, materials(id))').eq('id', moduleId!).single(),
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

  const doneCount = lessons.filter((l) => completedIds.has(l.id)).length
  const percent = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0
  const nextLesson = lessons.find((l) => !completedIds.has(l.id))

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link to="/aluno/gravado" className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Voltar aos módulos
      </Link>

      <ModuleHeader
        module={module}
        lessons={lessons}
        actions={
          doneCount > 0 && (
            <div className="flex items-center gap-3">
              <Progress value={percent} className="flex-1" />
              <span className="whitespace-nowrap text-xs text-fg-muted">
                {doneCount}/{lessons.length} · {percent}%
              </span>
            </div>
          )
        }
      />

      <ModuleObjective module={module} />

      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-fg-muted">Aulas</h2>

      <Card>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {lessons.map((lesson, index) => {
            const done = completedIds.has(lesson.id)
            const isNext = lesson.id === nextLesson?.id
            return (
              <Link
                key={lesson.id}
                to={`/aluno/aulas/${lesson.id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-border/20 ${isNext ? 'bg-primary/5' : ''}`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done ? 'bg-success/15 text-success' : 'bg-border/40 text-fg-muted'
                  }`}
                >
                  {lessonNumber(module.title, index)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{lesson.title}</p>
                  {lesson.description && (
                    <p className="truncate text-xs text-fg-muted">{plainText(lesson.description)}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-fg-muted">
                    {lesson.duration_minutes && <span>{lesson.duration_minutes} min</span>}
                    {lesson.materials.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip className="size-3" />
                        {lesson.materials.length} {lesson.materials.length === 1 ? 'material' : 'materiais'}
                      </span>
                    )}
                    {isNext && <span className="font-medium text-primary">A seguir</span>}
                  </div>
                </div>
                {done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-success" />
                ) : (
                  <PlayCircle className="size-5 shrink-0 text-fg-muted" />
                )}
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
