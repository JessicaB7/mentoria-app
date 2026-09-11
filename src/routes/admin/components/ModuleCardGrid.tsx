import * as React from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { getPublicUrl } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Lesson, Module } from '@/types/database'

export type ModuleWithLessons = Module & { lessons: Lesson[] }

export function ModuleCardGrid({
  modules,
  onEdit,
  onDelete,
}: {
  modules: ModuleWithLessons[]
  onEdit: (e: React.MouseEvent, module: Module) => void
  onDelete: (e: React.MouseEvent, module: Module) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((module) => (
        <Link key={module.id} to={`/admin/modulos/${module.id}`}>
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
            <CardHeader className="flex-row items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base">{module.title}</CardTitle>
                {module.description && <CardDescription>{module.description}</CardDescription>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" onClick={(e) => onEdit(e, module)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => onDelete(e, module)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-fg-muted">
                {module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}
                {!module.published && ' · Rascunho'}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
