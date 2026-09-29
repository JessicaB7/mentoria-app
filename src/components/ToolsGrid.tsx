import { toast } from 'sonner'
import { Download, ExternalLink, FileSpreadsheet, FileText, Link as LinkIcon, Pencil, Presentation, Wrench } from 'lucide-react'
import { getSignedUrl } from '@/lib/storage'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Tool } from '@/types/database'

const OTHER_CATEGORY = 'Outros'

function toolIcon(tool: Tool) {
  if (tool.url) return LinkIcon
  const name = `${tool.file_path} ${tool.file_type}`.toLowerCase()
  if (/sheet|excel|csv|\.xls|\.numbers/.test(name)) return FileSpreadsheet
  if (/presentation|powerpoint|\.ppt|\.key/.test(name)) return Presentation
  return FileText
}

function byTitle(a: Tool, b: Tool) {
  return a.title.localeCompare(b.title, 'pt', { sensitivity: 'base' })
}

export async function openTool(tool: Tool) {
  if (tool.url) {
    window.open(tool.url, '_blank', 'noopener,noreferrer')
    return
  }
  try {
    const url = await getSignedUrl('materials', tool.file_path!)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch {
    toast.error('Não foi possível abrir o ficheiro.')
  }
}

// Ferramentas agrupadas por categoria. No aluno abre o ficheiro/link; no admin abre a edição (onSelect).
export function ToolsGrid({ tools, onSelect }: { tools: Tool[]; onSelect?: (tool: Tool) => void }) {
  if (tools.length === 0) {
    return (
      <Card className="flex items-center gap-3 px-4 py-6 text-sm text-fg-muted">
        <Wrench className="size-5 shrink-0" />
        Ainda não há ferramentas disponíveis.
      </Card>
    )
  }

  const groups = new Map<string, Tool[]>()
  for (const tool of tools) {
    const category = tool.category?.trim() || OTHER_CATEGORY
    groups.set(category, [...(groups.get(category) ?? []), tool])
  }
  const categories = [...groups.keys()].sort((a, b) => {
    if (a === OTHER_CATEGORY) return 1
    if (b === OTHER_CATEGORY) return -1
    return a.localeCompare(b, 'pt', { sensitivity: 'base' })
  })

  return (
    <div className="flex flex-col gap-6">
      {categories.map((category) => (
        <section key={category} className="flex flex-col gap-3">
          {(categories.length > 1 || category !== OTHER_CATEGORY) && (
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">{category}</h2>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups
              .get(category)!
              .sort(byTitle)
              .map((tool) => {
                const Icon = toolIcon(tool)
                const ActionIcon = onSelect ? Pencil : tool.url ? ExternalLink : Download
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => (onSelect ? onSelect(tool) : openTool(tool))}
                    className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-fg">{tool.title}</p>
                        {!tool.published && <Badge variant="outline">Rascunho</Badge>}
                      </div>
                      {tool.description && (
                        <p className="line-clamp-3 text-xs text-fg-muted">{tool.description}</p>
                      )}
                      <span className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                        <ActionIcon className="size-3.5" />
                        {onSelect ? 'Editar' : tool.url ? 'Abrir' : 'Descarregar'}
                      </span>
                    </div>
                  </button>
                )
              })}
          </div>
        </section>
      ))}
    </div>
  )
}
