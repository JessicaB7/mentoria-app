import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, ClipboardList, FileCheck2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Lesson, Profile } from '@/types/database'

function checkInFilledCount(student: Profile) {
  return [
    student.current_services,
    student.challenges && student.challenges.length > 0 ? 'x' : null,
    student.other_challenges,
    student.enrollment_reason,
    student.success_definition,
    student.learning_goals,
    student.additional_notes,
  ].filter(Boolean).length
}

const CHECK_IN_FIELDS = 7

function formatDate(dateStr: string) {
  return new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr).toLocaleDateString('pt-PT')
}

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

export function IndividualAnalysis({ student, lessons }: { student: Profile; lessons: Lesson[] }) {
  const lessonIds = lessons.map((l) => l.id)

  const { data } = useQuery({
    queryKey: ['individual-analysis', student.id, lessonIds.join(',')],
    queryFn: async () => {
      const [
        { data: progress, error: progressError },
        { data: recordings, error: recordingsError },
        { data: materials, error: materialsError },
      ] = await Promise.all([
        supabase.from('lesson_progress').select('lesson_id').eq('student_id', student.id).eq('completed', true),
        lessonIds.length > 0
          ? supabase.from('session_recordings').select('lesson_id').in('lesson_id', lessonIds)
          : Promise.resolve({ data: [], error: null }),
        lessonIds.length > 0
          ? supabase.from('materials').select('lesson_id').in('lesson_id', lessonIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (progressError) throw progressError
      if (recordingsError) throw recordingsError
      if (materialsError) throw materialsError
      return {
        completedIds: new Set((progress ?? []).map((p) => p.lesson_id)),
        recordedIds: new Set((recordings ?? []).map((r) => r.lesson_id)),
        materialsCount: (materials ?? []).length,
      }
    },
  })

  const filled = checkInFilledCount(student)

  const today = new Date().toISOString().slice(0, 10)
  const done = lessons.filter((l) => l.session_date && l.session_date <= today)
  const upcoming = lessons
    .filter((l) => l.session_date && l.session_date > today)
    .sort((a, b) => a.session_date!.localeCompare(b.session_date!))
  const undated = lessons.filter((l) => !l.session_date)
  const lastDone = [...done].sort((a, b) => b.session_date!.localeCompare(a.session_date!))[0]

  const visible = lessons.filter((l) => l.published)
  const recordedDone = data ? done.filter((l) => data.recordedIds.has(l.id)).length : 0
  const missingRecording = data ? done.length - recordedDone : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise do acompanhamento</CardTitle>
        <p className="text-xs text-fg-muted">O que já foi feito e entregue até hoje.</p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <Block
          icon={ClipboardList}
          title="Check-in"
          status={
            filled === 0 ? (
              <Badge variant="warning">Por preencher</Badge>
            ) : filled === CHECK_IN_FIELDS ? (
              <Badge variant="success">Completo</Badge>
            ) : (
              <Badge variant="outline">Parcial</Badge>
            )
          }
        >
          <Progress value={(filled / CHECK_IN_FIELDS) * 100} />
          <Stat label="Campos preenchidos" value={`${filled}/${CHECK_IN_FIELDS}`} />
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
          <Stat label="Última sessão" value={lastDone ? formatDate(lastDone.session_date!) : '—'} />
          <Stat label="Próxima sessão" value={upcoming[0] ? formatDate(upcoming[0].session_date!) : '—'} />
        </Block>

        <Block
          icon={FileCheck2}
          title="Entregue ao aluno"
          status={
            missingRecording > 0 ? (
              <Badge variant="warning">
                {missingRecording} sem gravação
              </Badge>
            ) : (
              <Badge variant={recordedDone > 0 ? 'success' : 'outline'}>Em dia</Badge>
            )
          }
        >
          <Stat label="Gravações partilhadas" value={data ? `${recordedDone}/${done.length}` : '—'} />
          <Stat label="Materiais partilhados" value={data ? data.materialsCount : '—'} />
          <Stat label="Sessões visíveis" value={`${visible.length}/${lessons.length}`} />
          <Stat
            label="Vistas pelo aluno"
            value={data ? `${lessons.filter((l) => data.completedIds.has(l.id)).length}/${lessons.length}` : '—'}
          />
        </Block>
      </CardContent>
    </Card>
  )
}
