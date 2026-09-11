import { Link } from 'react-router-dom'
import { getPublicUrl } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Lesson, Module } from '@/types/database'

export type ModuleWithLessons = Module & { lessons: Lesson[] }

export function ModuleGrid({
  modules,
  completedIds,
}: {
  modules: ModuleWithLessons[]
  completedIds: Set<string>
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((module) => {
        const publishedLessons = module.lessons.filter((l) => l.published)
        const moduleCompleted = publishedLessons.filter((l) => completedIds.has(l.id)).length

        return (
          <Link key={module.id} to={`/aluno/modulos/${module.id}`}>
            <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
              {module.cover_path ? (
                <img
                  src={getPublicUrl('module-covers', module.cover_path)}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="aspect-video w-full bg-border" />
              )}
              <CardHeader>
                <CardTitle className="text-base">{module.title}</CardTitle>
                {module.description && <CardDescription>{module.description}</CardDescription>}
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-fg-muted">
                  {publishedLessons.length === 0
                    ? 'Sem aulas ainda'
                    : `${moduleCompleted} de ${publishedLessons.length} aulas concluídas`}
                </p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
