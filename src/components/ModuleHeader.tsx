import { Clock, PlayCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { Lesson, Module } from '@/types/database'

// "Módulo 1 — Posicionamento e Cliente Ideal" → { number: "01", name: "Posicionamento e Cliente Ideal" }
function splitModuleTitle(title: string) {
  const match = title.match(/^Módulo\s+(\d+)\s*[—–-]\s*(.+)$/)
  if (!match) return { number: null, name: title }
  return { number: match[1].padStart(2, '0'), name: match[2] }
}

const goldText = 'bg-gradient-to-b from-[#f1d488] via-[#d4af37] to-[#a9791f] bg-clip-text text-transparent'

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

// Cabeçalho compacto do módulo: painel escuro com o número do módulo em dourado (desenhado
// em código, para não cortar as capas, que são largas), título, descrição e resumo.
// `actions` fica por baixo (progresso, botões…).
export function ModuleHeader({
  module,
  lessons,
  actions,
}: {
  module: Module
  lessons: Lesson[]
  actions?: React.ReactNode
}) {
  const { number, name } = splitModuleTitle(module.title)
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0)

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="relative flex h-24 w-full shrink-0 items-center justify-between overflow-hidden bg-gradient-to-br from-[#0a0a0c] via-[#151210] to-[#1f1810] px-4 sm:h-auto sm:w-44 sm:justify-center sm:px-0">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full border border-[#d4af37]/35" />
          <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full border border-[#d4af37]/20" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(212,175,55,0.16),transparent_60%)]" />

          <div className="relative min-w-0 sm:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f1d488]">
              {number ? `Módulo ${number}` : 'Módulo'}
            </p>
            <h1 className="truncate text-lg font-semibold text-[#f5efe0]">{name}</h1>
          </div>

          {number && (
            <div className="relative flex flex-col items-center">
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.3em] text-[#f1d488]/80 sm:block">
                Módulo
              </span>
              <span className={`text-5xl font-bold leading-none tracking-tight sm:text-6xl ${goldText}`}>{number}</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="hidden sm:block">
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
