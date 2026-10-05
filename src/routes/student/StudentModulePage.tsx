import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Paperclip, PlayCircle, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getPublicUrl } from '@/lib/storage'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import type { Lesson, Module } from '@/types/database'

type LessonWithMaterials = Lesson & { materials: { id: string }[] }
type ModuleWithLessons = Module & { lessons: LessonWithMaterials[] }

// "Módulo 1 — Posicionamento e Cliente Ideal" → { label: "Módulo 01", name: "Posicionamento e Cliente Ideal" }
function splitTitle(title: string) {
  const match = title.match(/^Módulo\s+(\d+)\s*[—–-]\s*(.+)$/)
  if (!match) return { label: null, name: title }
  return { label: `Módulo ${match[1].padStart(2, '0')}`, name: match[2] }
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

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
  const { label, name } = splitTitle(module.title)
  const coverUrl = module.cover_path ? getPublicUrl('module-covers', module.cover_path) : null

  const doneCount = lessons.filter((l) => completedIds.has(l.id)).length
  const percent = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0)
  const nextLesson = lessons.find((l) => !completedIds.has(l.id))
  const allDone = lessons.length > 0 && !nextLesson
  const ctaLesson = nextLesson ?? lessons[0]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link to="/aluno/gravado" className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Voltar aos módulos
      </Link>

      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Telemóvel: faixa baixa com o título por cima. Computador: capa pequena à esquerda. */}
          <div className="relative h-36 w-full shrink-0 bg-gradient-to-br from-[#0a0a0c] via-[#151210] to-[#1f1810] sm:h-auto sm:w-1/3">
            {coverUrl && (
              <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent sm:hidden" />
            <div className="absolute inset-x-4 bottom-3 sm:hidden">
              {label && (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f1d488]">{label}</p>
              )}
              <h1 className="text-lg font-semibold text-[#f5efe0]">{name}</h1>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
            <div className="hidden sm:block">
              {label && (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{label}</p>
              )}
              <h1 className="text-xl font-semibold text-fg">{name}</h1>
              <div className="mt-1 h-0.5 w-10 rounded-full bg-gradient-to-r from-[#f1d488] via-[#d4af37] to-[#a9791f]" />
            </div>

            {module.description && <p className="text-sm text-fg-muted">{module.description}</p>}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
              <span className="flex items-center gap-1">
                <PlayCircle className="size-3.5" />
                {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}
              </span>
              {totalMinutes > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {formatDuration(totalMinutes)}
                </span>
              )}
            </div>

            {lessons.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-fg-muted">
                    {doneCount} de {lessons.length} aulas concluídas
                  </span>
                  <span className="font-medium text-fg">{percent}%</span>
                </div>
                <Progress value={percent} />
              </div>
            )}

            {ctaLesson && (
              <Button asChild className="mt-auto w-full sm:w-fit">
                <Link to={`/aluno/aulas/${ctaLesson.id}`}>
                  {allDone ? (
                    <>
                      <RotateCcw /> Rever módulo
                    </>
                  ) : (
                    <>
                      {doneCount === 0 ? 'Começar' : 'Continuar'}: {ctaLesson.title} <ArrowRight />
                    </>
                  )}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Card>

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
                  {done ? <CheckCircle2 className="size-4" /> : String(index + 1).padStart(2, '0')}
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
                <PlayCircle className="size-5 shrink-0 text-fg-muted" />
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
