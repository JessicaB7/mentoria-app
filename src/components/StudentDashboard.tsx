import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, PartyPopper, Play, Radio } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Lesson, Module } from '@/types/database'

type LessonWithModule = Lesson & { modules: Pick<Module, 'position'> | null }

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateStr}T00:00:00`)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function ProgressRing({ value }: { value: number }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative size-20 shrink-0">
      <svg viewBox="0 0 72 72" className="size-full -rotate-90">
        <defs>
          <linearGradient id="progress-ring-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e4cc8f" />
            <stop offset="100%" stopColor="#8a6a17" />
          </linearGradient>
        </defs>
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeOpacity="0.5"
          strokeWidth="6"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="url(#progress-ring-gold)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-semibold text-fg">
        {value}%
      </span>
    </div>
  )
}

export function StudentDashboard({ studentId }: { studentId: string }) {
  const { data } = useQuery({
    queryKey: ['student-dashboard', studentId],
    queryFn: async () => {
      const [
        { data: curriculum, error: curriculumError },
        { data: progress, error: progressError },
        { data: liveSessions, error: liveError },
      ] = await Promise.all([
        supabase.from('lessons').select('*, modules(position)').eq('category', 'modulo').eq('published', true),
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
      ])
      if (curriculumError) throw curriculumError
      if (progressError) throw progressError
      if (liveError) throw liveError

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
          <p className="text-sm text-fg">Concluíste todo o currículo gravado. 🎉 Parabéns pelo percurso até aqui!</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {data.total > 0 && (
          <div className="flex items-center gap-5 rounded-2xl border border-border bg-surface p-5 shadow-sm lg:col-span-2">
            <ProgressRing value={pct} />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-fg-muted">Progresso no currículo</p>
              <p className="mt-1 font-display text-2xl font-semibold text-fg">
                {data.completed} <span className="text-fg-muted">de {data.total} aulas</span>
              </p>
              <p className="mt-0.5 text-xs text-fg-muted">
                {data.completed === 0
                  ? 'Dá o primeiro passo hoje.'
                  : pct < 100
                    ? 'Continua, estás no bom caminho.'
                    : 'Currículo concluído!'}
              </p>
            </div>
          </div>
        )}

        {(data.nextLesson || data.nextLiveSession) && (
          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-primary/40 bg-[#121212] shadow-sm lg:col-span-3">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(60% 140% at 100% 0%, rgba(201, 169, 97, 0.25), transparent 70%)' }}
            />
            {data.nextLesson && (
              <Link
                to={`/aluno/aulas/${data.nextLesson.id}`}
                className="group relative flex flex-1 items-center gap-4 p-5"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e4cc8f] to-primary text-[#121212] shadow-md transition-transform group-hover:scale-105">
                  <Play className="ml-0.5 size-5 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c9a961]">O teu próximo passo</p>
                  <p className="mt-1 truncate font-display text-xl font-semibold text-white">{data.nextLesson.title}</p>
                </div>
                <span className="hidden shrink-0 items-center gap-1 rounded-full border border-[#c9a961]/40 px-3 py-1.5 text-xs font-medium text-[#e4cc8f] transition-colors group-hover:bg-[#c9a961]/15 sm:inline-flex">
                  {data.completed === 0 ? 'Começar' : 'Continuar'}
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
            )}
            {data.nextLiveSession && (
              <Link
                to="/aluno/ao-vivo"
                className={cn(
                  'relative flex items-center gap-3 px-5 py-3 text-sm text-white/80 hover:text-white',
                  data.nextLesson && 'border-t border-white/10',
                )}
              >
                <Radio className="size-4 shrink-0 text-[#c9a961]" />
                <span className="truncate">
                  <span className="text-white/50">Próxima sessão ao vivo · </span>
                  {data.nextLiveSession.title} ·{' '}
                  {(() => {
                    const d = daysUntil(data.nextLiveSession.session_date!)
                    if (d === 0) return 'hoje'
                    if (d === 1) return 'amanhã'
                    return `em ${d} dias`
                  })()}
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
