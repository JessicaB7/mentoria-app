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

function SessionGroup({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col border-t border-border pt-1.5 first:border-t-0 first:pt-0">
      <p className="mb-0.5 px-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">Sessão {n}</p>
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

  // Check-in
  const withFilled = students.map((student) => ({ student, filled: checkInFilledCount(student) }))
  const checkInComplete = withFilled.filter((s) => s.filled === CHECK_IN_FIELDS)
  const checkInPartial = withFilled
    .filter((s) => s.filled > 0 && s.filled < CHECK_IN_FIELDS)
    .map(({ student, filled }) => ({ student, detail: `${filled}/${CHECK_IN_FIELDS}` }))
  const checkInMissing = withFilled.filter((s) => s.filled === 0)

  // Número da sessão: "Sessão 2 - …" → 2; sem número no título, usa a ordem da aula para esse aluno.
  const sessionNumber = new Map<string, number>()
  for (const student of students) {
    const mine = [...lessonsOf(student.id)].sort((a, b) => a.position - b.position)
    mine.forEach((l, i) => {
      const match = l.title.match(/sess[ãa]o\s*(\d+)/i)
      sessionNumber.set(l.id, match ? Number(match[1]) : i + 1)
    })
  }
  const numbers = [...new Set([1, 2, 3, ...sessionNumber.values()])].sort((a, b) => a - b)
  const sessionOf = (studentId: string, n: number) =>
    lessonsOf(studentId).find((l) => sessionNumber.get(l.id) === n)
  const isDone = (l: Lesson) => !!l.session_date && l.session_date <= today

  const done = studentLessons.filter(isDone)
  const recordedDone = data ? done.filter((l) => data.recordedIds.has(l.id)).length : 0
  const missingRecording = data ? done.length - recordedDone : 0

  const bySession = numbers.map((n) => {
    const rows = students.map((student) => ({ student, lesson: sessionOf(student.id, n) }))
    const doneRows = rows.filter((r) => r.lesson && isDone(r.lesson))
    return {
      n,
      done: doneRows.map(({ student, lesson }) => ({ student, detail: formatDate(lesson!.session_date!) })),
      upcoming: rows
        .filter((r) => r.lesson?.session_date && r.lesson.session_date > today)
        .map(({ student, lesson }) => ({ student, detail: formatDate(lesson!.session_date!) })),
      unscheduled: rows
        .filter((r) => !r.lesson || !r.lesson.session_date)
        .map(({ student, lesson }) => ({ student, detail: lesson ? 'sem data' : 'por criar' })),
      recorded: data ? doneRows.filter((r) => data.recordedIds.has(r.lesson!.id)).map(({ student }) => ({ student })) : [],
      notRecorded: data ? doneRows.filter((r) => !data.recordedIds.has(r.lesson!.id)).map(({ student }) => ({ student })) : [],
      materials: data
        ? rows.flatMap(({ student, lesson }) => {
            const count = lesson ? (data.materialsByLesson.get(lesson.id) ?? 0) : 0
            return count > 0 ? [{ student, detail: String(count) }] : []
          })
        : [],
      seen: data
        ? rows.filter((r) => r.lesson && data.completedIds.has(r.lesson.id)).map(({ student }) => ({ student }))
        : [],
      doneCount: doneRows.length,
    }
  })

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
          {bySession.map((s) => (
            <SessionGroup key={s.n} n={s.n}>
              <Stat label="Realizadas" value={s.done.length} people={s.done} />
              <Stat label="Agendadas" value={s.upcoming.length} people={s.upcoming} />
              <Stat label="Por agendar" value={s.unscheduled.length} people={s.unscheduled} warn />
            </SessionGroup>
          ))}
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
          {bySession.map((s) => (
            <SessionGroup key={s.n} n={s.n}>
              <Stat
                label="Gravação partilhada"
                value={data ? `${s.recorded.length}/${s.doneCount}` : '—'}
                people={s.recorded}
              />
              {s.notRecorded.length > 0 && (
                <Stat label="Sem gravação" value={s.notRecorded.length} people={s.notRecorded} warn />
              )}
              <Stat label="Com materiais" value={data ? s.materials.length : '—'} people={s.materials} />
              <Stat label="Vista pelo aluno" value={data ? s.seen.length : '—'} people={s.seen} />
            </SessionGroup>
          ))}
        </Block>
      </CardContent>
    </Card>
  )
}
