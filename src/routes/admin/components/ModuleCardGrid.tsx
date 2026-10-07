import * as React from 'react'
import { Link } from 'react-router-dom'
import { EyeOff, Pencil, Trash2 } from 'lucide-react'
import { getPublicUrl } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { Lesson, Module } from '@/types/database'

export type ModuleWithLessons = Module & { lessons: Lesson[] }

export function ModuleCardGrid({
  modules,
  onEdit,
  onDelete,
  onTogglePublished,
}: {
  modules: ModuleWithLessons[]
  onEdit: (e: React.MouseEvent, module: Module) => void
  onDelete: (e: React.MouseEvent, module: Module) => void
  onTogglePublished: (module: Module) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((module) => (
        <Link key={module.id} to={`/admin/gravado/aulas/modulos/${module.id}`}>
          <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
            <div className="relative">
              {module.cover_path ? (
                <img
                  src={getPublicUrl('module-covers', module.cover_path)}
                  alt=""
                  className={`aspect-video w-full object-cover ${module.published ? '' : 'opacity-40 grayscale'}`}
                />
              ) : (
                <div className="aspect-video w-full bg-border" />
              )}
              {!module.published && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#121212]/85 px-2.5 py-1 text-xs font-medium text-white">
                  <EyeOff className="size-3.5" /> Oculto para alunos
                </span>
              )}
            </div>
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
            <CardContent className="flex items-center justify-between gap-2 pt-0">
              <p className="text-xs text-fg-muted">
                {module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}
              </p>
              {/* Fica dentro do link do cartão: o clique no interruptor não abre o módulo */}
              <div
                role="presentation"
                className="flex cursor-pointer items-center gap-2 text-xs text-fg-muted"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onTogglePublished(module)
                }}
              >
                {module.published ? 'Visível para alunos' : 'Não visível'}
                <Switch checked={module.published} />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
