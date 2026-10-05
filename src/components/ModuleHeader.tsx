import { Clock, PlayCircle } from 'lucide-react'
import { getPublicUrl } from '@/lib/storage'
import { Card } from '@/components/ui/card'
import type { Lesson, Module } from '@/types/database'

// "Módulo 1 — Posicionamento e Cliente Ideal" → { label: "Módulo 01", name: "Posicionamento e Cliente Ideal" }
function splitModuleTitle(title: string) {
  const match = title.match(/^Módulo\s+(\d+)\s*[—–-]\s*(.+)$/)
  if (!match) return { label: null, name: title }
  return { label: `Módulo ${match[1].padStart(2, '0')}`, name: match[2] }
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

// Cabeçalho compacto do módulo: capa pequena (faixa baixa no telemóvel, coluna à esquerda
// no computador), título, descrição e resumo. `actions` fica por baixo (progresso, botões…).
export function ModuleHeader({
  module,
  lessons,
  actions,
}: {
  module: Module
  lessons: Lesson[]
  actions?: React.ReactNode
}) {
  const { label, name } = splitModuleTitle(module.title)
  const coverUrl = module.cover_path ? getPublicUrl('module-covers', module.cover_path) : null
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0)

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-32 w-full shrink-0 bg-gradient-to-br from-[#0a0a0c] via-[#151210] to-[#1f1810] sm:h-auto sm:min-h-44 sm:w-64">
          {coverUrl && <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent sm:hidden" />
          <div className="absolute inset-x-4 bottom-3 sm:hidden">
            {label && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f1d488]">{label}</p>}
            <h1 className="text-lg font-semibold text-[#f5efe0]">{name}</h1>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="hidden sm:block">
            {label && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{label}</p>}
            <h1 className="text-xl font-semibold text-fg">{name}</h1>
            <div className="mt-1.5 h-0.5 w-10 rounded-full bg-gradient-to-r from-[#f1d488] via-[#d4af37] to-[#a9791f]" />
          </div>

          {module.description && <p className="text-sm text-fg-muted">{module.description}</p>}

          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <span className="flex items-center gap-1 rounded-full bg-border/40 px-2.5 py-1">
              <PlayCircle className="size-3.5" />
              {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}
            </span>
            {totalMinutes > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-border/40 px-2.5 py-1">
                <Clock className="size-3.5" />
                {formatDuration(totalMinutes)}
              </span>
            )}
          </div>

          {actions}
        </div>
      </div>
    </Card>
  )
}
