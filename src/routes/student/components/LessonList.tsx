import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SESSION_TYPE_LABELS } from '@/lib/sessionType'
import type { Lesson } from '@/types/database'

export function LessonList({
  lessons,
  completedIds,
  emptyLabel,
  linkBase = '/aluno/aulas',
  leadingItem,
}: {
  lessons: Lesson[]
  completedIds: Set<string>
  emptyLabel?: string
  linkBase?: string
  leadingItem?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col divide-y divide-border p-0">
        {leadingItem}
        {lessons.map((lesson) => {
          const done = completedIds.has(lesson.id)
          return (
            <Link
              key={lesson.id}
              to={`${linkBase}/${lesson.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-border/20"
            >
              {done ? (
                <CheckCircle2 className="size-5 shrink-0 text-success" />
              ) : (
                <Circle className="size-5 shrink-0 text-fg-muted" />
              )}
              <PlayCircle className="size-4 shrink-0 text-fg-muted" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-fg">{lesson.title}</p>
                  {lesson.session_type && <Badge>{SESSION_TYPE_LABELS[lesson.session_type]}</Badge>}
                </div>
                {(lesson.session_date || lesson.duration_minutes) && (
                  <p className="text-xs text-fg-muted">
                    {lesson.session_date &&
                      new Date(lesson.session_date + 'T00:00:00').toLocaleDateString('pt-PT')}
                    {lesson.session_date && lesson.duration_minutes && ' · '}
                    {lesson.duration_minutes && `${lesson.duration_minutes} min`}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
        {lessons.length === 0 && (
          <p className="px-4 py-6 text-sm text-fg-muted">{emptyLabel ?? 'Sem aulas por aqui ainda.'}</p>
        )}
      </CardContent>
    </Card>
  )
}
