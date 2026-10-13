import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, ClipboardList, FileCheck2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CHECK_IN_FIELDS, checkInFilledCount } from '@/lib/checkIn'
import type { Lesson, Profile } from '@/types/database'

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-fg-muted">{label}</span>
      <span className="font-medium text-fg">{value}</span>
    </div>
  )
}

function Block({
  icon: Icon,
  title,
  status,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  status: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-fg-muted" />
          <span className="text-sm font-semibold text-fg">{title}</span>
        </div>
        {status}
      </div>
      {children}
    </div>
  )
}

// Visão geral de todos os alunos: check-in, sessões feitas e o que já lhes foi entregue.
export function IndividualAnalysis({ students, lessons }: { students: Profile[]; lessons: Lesson[] }) {
  const studentLessons = lessons.filter((l) => l.student_id)
  const lessonIds = studentLessons.map((l) => l.id)

  const { data } = useQuery({
    queryKey: ['individual-analysis', lessonIds.join(',')],
    queryFn: async () => {
      if (lessonIds.length === 0) {
        return { completedCount: 0, recordedIds: new Set<string>(), materialsCount: 0 }
      }
      const [
        { data: progress, error: progressError },
        { data: recordings, error: recordingsError },
        { data: materials, error: materialsError },
      ] = await Promise.all([
        supabase.from('lesson_progress').select('student_id, lesson_id').eq('completed', true).in('lesson_id', lessonIds),
        supabase.from('session_recordings').select('lesson_id').in('lesson_id', lessonIds),
        supabase.from('materials').select('lesson_id').in('lesson_id', lessonIds),
      ])
      if (progressError) throw progressError
      if (recordingsError) throw recordingsError
      if (materialsError) throw materialsError
      const ownerById = new Map(studentLessons.map((l) => [l.id, l.student_id]))
      return {
        completedCount: (progress ?? []).filter((p) => ownerById.get(p.lesson_id) === p.student_id).length,
        recordedIds: new Set((recordings ?? []).map((r) => r.lesson_id)),
        materialsCount: (materials ?? []).length,
      }
    },
  })

  const filledCounts = students.map(checkInFilledCount)
  const checkInComplete = filledCounts.filter((n) => n === CHECK_IN_FIELDS).length
  const checkInPartial = filledCounts.filter((n) => n > 0 && n < CHECK_IN_FIELDS).length
  const checkInMissing = filledCounts.filter((n) => n === 0).length

  const today = new Date().toISOString().slice(0, 10)
  const done = studentLessons.filter((l) => l.session_date && l.session_date <= today)
  const upcoming = studentLessons.filter((l) => l.session_date && l.session_date > today)
  const undated = studentLessons.filter((l) => !l.session_date)
  const withoutSessions = students.filter((s) => !done.some((l) => l.student_id === s.id)).length

  const recordedDone = data ? done.filter((l) => data.recordedIds.has(l.id)).length : 0
  const missingRecording = data ? done.length - recordedDone : 0
  const visible = studentLessons.filter((l) => l.published).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise geral</CardTitle>
        <p className="text-xs text-fg-muted">
          O que já foi feito e entregue no acompanhamento individual, somando todos os alunos.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <Block
          icon={ClipboardList}
          title="Check-in"
          status={
            <Badge variant={checkInMissing > 0 ? 'warning' : 'success'}>
              {checkInComplete + checkInPartial}/{students.length} preenchidos
            </Badge>
          }
        >
          <Stat label="Completos" value={checkInComplete} />
          <Stat label="Parciais" value={checkInPartial} />
          <Stat
            label="Por preencher"
            value={checkInMissing > 0 ? <span className="text-warning">{checkInMissing}</span> : 0}
          />
        </Block>

        <Block
          icon={CalendarCheck}
          title="Sessões"
          status={
            <Badge variant={done.length > 0 ? 'success' : 'outline'}>
              {done.length} {done.length === 1 ? 'realizada' : 'realizadas'}
            </Badge>
          }
        >
          <Stat label="Agendadas" value={upcoming.length} />
          {undated.length > 0 && <Stat label="Sem data" value={undated.length} />}
          <Stat
            label="Alunos sem nenhuma sessão"
            value={withoutSessions > 0 ? <span className="text-warning">{withoutSessions}</span> : 0}
          />
        </Block>

        <Block
          icon={FileCheck2}
          title="Entregue aos alunos"
          status={
            missingRecording > 0 ? (
              <Badge variant="warning">{missingRecording} sem gravação</Badge>
            ) : (
              <Badge variant={recordedDone > 0 ? 'success' : 'outline'}>Em dia</Badge>
            )
          }
        >
          <Stat label="Gravações partilhadas" value={data ? `${recordedDone}/${done.length}` : '—'} />
          <Stat label="Materiais partilhados" value={data ? data.materialsCount : '—'} />
          <Stat label="Sessões visíveis" value={`${visible}/${studentLessons.length}`} />
          <Stat label="Vistas pelos alunos" value={data ? `${data.completedCount}/${studentLessons.length}` : '—'} />
        </Block>
      </CardContent>
    </Card>
  )
}
