import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, ChevronDown, ClipboardList, FileCheck2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CHECK_IN_FIELDS, checkInFilledCount } from '@/lib/checkIn'
import type { Lesson, Profile } from '@/types/database'

type Person = { student: Profile; detail?: string }

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('pt-PT')
}

// Linha com o total; ao clicar mostra a lista dos alunos que a compõem.
function Stat({
  label,
  value,
  people,
  warn = false,
}: {
  label: string
  value: React.ReactNode
  people: Person[]
  warn?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={people.length === 0}
        className="flex items-center justify-between gap-2 rounded-md px-1 py-0.5 text-left text-sm enabled:hover:bg-border/30"
      >
        <span className="flex items-center gap-1 text-fg-muted">
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform',
              open ? '' : '-rotate-90',
              people.length === 0 && 'invisible',
            )}
          />
          {label}
        </span>
        <span className={cn('font-medium', warn && people.length > 0 ? 'text-warning' : 'text-fg')}>{value}</span>
      </button>
      {open && people.length > 0 && (
        <ul className="mb-1 ml-5 mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
          {people.map(({ student, detail }) => (
            <li key={student.id} className="flex items-center justify-between gap-2 text-xs">
              <Link to={`/admin/alunos/individual/${student.id}`} className="truncate text-fg hover:underline">
                {student.full_name}
              </Link>
              {detail && <span className="shrink-0 text-fg-muted">{detail}</span>}
            </li>
          ))}
        </ul>
      )}
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
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
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
        return { completedIds: new Set<string>(), recordedIds: new Set<string>(), materialsByLesson: new Map<string, number>() }
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
      const materialsByLesson = new Map<string, number>()
      for (const m of materials ?? []) materialsByLesson.set(m.lesson_id, (materialsByLesson.get(m.lesson_id) ?? 0) + 1)
      return {
        completedIds: new Set(
          (progress ?? []).filter((p) => ownerById.get(p.lesson_id) === p.student_id).map((p) => p.lesson_id),
        ),
        recordedIds: new Set((recordings ?? []).map((r) => r.lesson_id)),
        materialsByLesson,
      }
    },
  })

  const today = new Date().toISOString().slice(0, 10)
  const lessonsOf = (studentId: string) => studentLessons.filter((l) => l.student_id === studentId)
  const doneOf = (studentId: string) =>
    lessonsOf(studentId).filter((l) => l.session_date && l.session_date <= today)

  // Check-in
  const withFilled = students.map((student) => ({ student, filled: checkInFilledCount(student) }))
  const checkInComplete = withFilled.filter((s) => s.filled === CHECK_IN_FIELDS)
  const checkInPartial = withFilled
    .filter((s) => s.filled > 0 && s.filled < CHECK_IN_FIELDS)
    .map(({ student, filled }) => ({ student, detail: `${filled}/${CHECK_IN_FIELDS}` }))
  const checkInMissing = withFilled.filter((s) => s.filled === 0)

  // Sessões
  const done = studentLessons.filter((l) => l.session_date && l.session_date <= today)
  const upcoming = studentLessons.filter((l) => l.session_date && l.session_date > today)
  const undated = studentLessons.filter((l) => !l.session_date)

  const doneByStudent: Person[] = students.flatMap((student) => {
    const mine = doneOf(student.id)
    if (mine.length === 0) return []
    const last = mine.map((l) => l.session_date!).sort().at(-1)!
    return [{ student, detail: `${mine.length} · última ${formatDate(last)}` }]
  })
  const upcomingByStudent: Person[] = students.flatMap((student) => {
    const mine = upcoming.filter((l) => l.student_id === student.id)
    if (mine.length === 0) return []
    const next = mine.map((l) => l.session_date!).sort()[0]
    return [{ student, detail: `${mine.length} · próxima ${formatDate(next)}` }]
  })
  const undatedByStudent: Person[] = students.flatMap((student) => {
    const n = undated.filter((l) => l.student_id === student.id).length
    return n > 0 ? [{ student, detail: String(n) }] : []
  })
  const withoutSessions: Person[] = students.filter((s) => doneOf(s.id).length === 0).map((student) => ({ student }))

  // Entregue
  const recordedDone = data ? done.filter((l) => data.recordedIds.has(l.id)).length : 0
  const missingRecording = data ? done.length - recordedDone : 0

  const missingRecordingByStudent: Person[] = data
    ? students.flatMap((student) => {
        const n = doneOf(student.id).filter((l) => !data.recordedIds.has(l.id)).length
        return n > 0 ? [{ student, detail: `${n} sem gravação` }] : []
      })
    : []
  const recordingsByStudent: Person[] = data
    ? students.flatMap((student) => {
        const mine = doneOf(student.id)
        const n = mine.filter((l) => data.recordedIds.has(l.id)).length
        return mine.length > 0 ? [{ student, detail: `${n}/${mine.length}` }] : []
      })
    : []
  const materialsByStudent: Person[] = data
    ? students.flatMap((student) => {
        const n = lessonsOf(student.id).reduce((sum, l) => sum + (data.materialsByLesson.get(l.id) ?? 0), 0)
        return n > 0 ? [{ student, detail: String(n) }] : []
      })
    : []
  const materialsCount = data ? [...data.materialsByLesson.values()].reduce((a, b) => a + b, 0) : 0
  const visibleByStudent: Person[] = students.flatMap((student) => {
    const mine = lessonsOf(student.id)
    return mine.length > 0 ? [{ student, detail: `${mine.filter((l) => l.published).length}/${mine.length}` }] : []
  })
  const seenByStudent: Person[] = data
    ? students.flatMap((student) => {
        const mine = lessonsOf(student.id)
        return mine.length > 0
          ? [{ student, detail: `${mine.filter((l) => data.completedIds.has(l.id)).length}/${mine.length}` }]
          : []
      })
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise geral</CardTitle>
        <p className="text-xs text-fg-muted">
          O que já foi feito e entregue no acompanhamento individual. Clica numa linha para ver os alunos.
        </p>
      </CardHeader>
      <CardContent className="grid items-start gap-3 md:grid-cols-3">
        <Block
          icon={ClipboardList}
          title="Check-in"
          status={
            <Badge variant={checkInMissing.length > 0 ? 'warning' : 'success'}>
              {checkInComplete.length + checkInPartial.length}/{students.length} preenchidos
            </Badge>
          }
        >
          <Stat label="Completos" value={checkInComplete.length} people={checkInComplete} />
          <Stat label="Parciais" value={checkInPartial.length} people={checkInPartial} />
          <Stat label="Por preencher" value={checkInMissing.length} people={checkInMissing} warn />
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
          <Stat label="Realizadas" value={done.length} people={doneByStudent} />
          <Stat label="Agendadas" value={upcoming.length} people={upcomingByStudent} />
          {undated.length > 0 && <Stat label="Sem data" value={undated.length} people={undatedByStudent} />}
          <Stat label="Alunos sem nenhuma sessão" value={withoutSessions.length} people={withoutSessions} warn />
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
          <Stat
            label="Gravações partilhadas"
            value={data ? `${recordedDone}/${done.length}` : '—'}
            people={recordingsByStudent}
          />
          {missingRecording > 0 && (
            <Stat label="Sem gravação" value={missingRecording} people={missingRecordingByStudent} warn />
          )}
          <Stat label="Materiais partilhados" value={data ? materialsCount : '—'} people={materialsByStudent} />
          <Stat
            label="Sessões visíveis"
            value={`${studentLessons.filter((l) => l.published).length}/${studentLessons.length}`}
            people={visibleByStudent}
          />
          <Stat
            label="Vistas pelos alunos"
            value={data ? `${data.completedIds.size}/${studentLessons.length}` : '—'}
            people={seenByStudent}
          />
        </Block>
      </CardContent>
    </Card>
  )
}
