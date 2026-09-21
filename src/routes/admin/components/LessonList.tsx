import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { SESSION_TYPE_LABELS } from '@/lib/sessionType'
import type { Lesson, Profile } from '@/types/database'

export type LessonWithStudent = Lesson & { profiles: Pick<Profile, 'id' | 'full_name' | 'email'> | null }

export function LessonList({
  lessons,
  showStudent,
  emptyLabel,
  onEdit,
  onDelete,
  onTogglePublished,
  leadingItem,
}: {
  lessons: LessonWithStudent[]
  showStudent: boolean
  emptyLabel?: string
  onEdit: (lesson: Lesson) => void
  onDelete: (lesson: Lesson) => void
  onTogglePublished: (lesson: Lesson) => void
  leadingItem?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col divide-y divide-border p-0">
        {leadingItem}
        {lessons.map((lesson) => (
          <div key={lesson.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm text-fg">{lesson.title}</span>
              {lesson.session_type && <Badge>{SESSION_TYPE_LABELS[lesson.session_type]}</Badge>}
              {lesson.session_date && (
                <Badge variant="outline">
                  {new Date(lesson.session_date + 'T00:00:00').toLocaleDateString('pt-PT')}
                </Badge>
              )}
              {!lesson.published && <Badge variant="outline">Rascunho</Badge>}
              {showStudent && (
                <Badge variant="outline">
                  {lesson.profiles ? lesson.profiles.full_name : 'Sem aluno · visível a todos'}
                </Badge>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Switch checked={lesson.published} onCheckedChange={() => onTogglePublished(lesson)} />
              <Button variant="ghost" size="icon" onClick={() => onEdit(lesson)}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(lesson)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {lessons.length === 0 && (
          <p className="px-4 py-6 text-sm text-fg-muted">{emptyLabel ?? 'Sem aulas ainda.'}</p>
        )}
      </CardContent>
    </Card>
  )
}
