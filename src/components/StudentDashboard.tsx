import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, PartyPopper, PlayCircle, Radio } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { Lesson, Module, StudentGoal } from '@/types/database'

type LessonWithModule = Lesson & { modules: Pick<Module, 'position'> | null }

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateStr}T00:00:00`)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function StudentDashboard({ studentId }: { studentId: string }) {
  const { data } = useQuery({
    queryKey: ['student-dashboard', studentId],
    queryFn: async () => {
      const [
        { data: curriculum, error: curriculumError },
        { data: progress, error: progressError },
        { data: liveSessions, error: liveError },
        { data: goals, error: goalsError },
      ] = await Promise.all([
        supabase
          .from('lessons')
          .select('*, modules(position)')
          .eq('category', 'modulo')
          .eq('published', true),
        supabase.from('lesson_progress').select('*').eq('student_id', studentId).eq('completed', true),
        supabase
          .from('lessons')
          .select('*')
          .eq('category', 'ao_vivo')
          .eq('published', true)
          .not('session_date', 'is', null)
          .gte('session_date', new Date().toISOString().slice(0, 10))
          .order('session_date', { ascending: true })
          .limit(1),
        supabase.from('student_goals').select('*').eq('student_id', studentId).eq('status', 'concluido'),
      ])
      if (curriculumError) throw curriculumError
      if (progressError) throw progressError
      if (liveError) throw liveError
      if (goalsError) throw goalsError

      const lessons = (curriculum ?? []) as unknown as LessonWithModule[]
      const completedIds = new Set((progress ?? []).map((p) => p.lesson_id))

      const sorted = [...lessons].sort((a, b) => {
        const modA = a.modules?.position ?? 0
        const modB = b.modules?.position ?? 0
        if (modA !== modB) return modA - modB
        return a.position - b.position
      })
      const nextLesson = sorted.find((l) => !completedIds.has(l.id)) ?? null

      return {
        total: lessons.length,
        completed: completedIds.size,
        nextLesson,
        nextLiveSession: ((liveSessions ?? [])[0] as Lesson | undefined) ?? null,
        completedGoals: (goals ?? []) as StudentGoal[],
      }
    },
  })

  if (!data) return null

  const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0

  return (
    <div className="flex flex-col gap-3">
      {pct === 100 && data.total > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
          <PartyPopper className="size-4 shrink-0 text-success" />
          <p className="text-sm text-fg">
            Concluíste todo o currículo gravado. 🎉 Parabéns pelo percurso até aqui!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.total > 0 && (
          <Card>
            <CardContent className="flex flex-col gap-2 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                Progresso no currículo
              </p>
              <Progress value={pct} />
              <p className="text-xs text-fg-muted">
                {data.completed} de {data.total} aulas concluídas ({pct}%)
              </p>
            </CardContent>
          </Card>
        )}

        {(data.nextLesson || data.nextLiveSession) && (
          <Card>
            <CardContent className="flex flex-col gap-2.5 pt-4">
              {data.nextLesson && (
                <Link
                  to={`/aluno/aulas/${data.nextLesson.id}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <PlayCircle className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                      O teu próximo passo
                    </p>
                    <p className="truncate text-sm text-fg">{data.nextLesson.title}</p>
                  </div>
                </Link>
              )}
              {data.nextLiveSession && (
                <Link
                  to="/aluno/ao-vivo"
                  className={
                    data.nextLesson
                      ? 'flex items-center gap-2 border-t border-border pt-2.5 hover:underline'
                      : 'flex items-center gap-2 hover:underline'
                  }
                >
                  <Radio className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                      Próxima sessão ao vivo
                    </p>
                    <p className="truncate text-sm text-fg">
                      {data.nextLiveSession.title} ·{' '}
                      {(() => {
                        const d = daysUntil(data.nextLiveSession.session_date!)
                        if (d === 0) return 'hoje'
                        if (d === 1) return 'amanhã'
                        return `em ${d} dias`
                      })()}
                    </p>
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {data.completedGoals.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
            <CheckCircle2 className="size-3.5 text-success" />
            Objetivos alcançados
          </span>
          {data.completedGoals.map((goal) => (
            <Badge key={goal.id} variant="success">
              {goal.title}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
