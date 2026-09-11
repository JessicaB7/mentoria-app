import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Lesson } from '@/types/database'

export function LessonList({
  lessons,
  completedIds,
  emptyLabel,
}: {
  lessons: Lesson[]
  completedIds: Set<string>
  emptyLabel?: string
}) {
  return (
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
          <p className="px-4 py-6 text-sm text-fg-muted">{emptyLabel ?? 'Sem aulas por aqui ainda.'}</p>
        )}
      </CardContent>
    </Card>
  )
}
