import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, FolderOpen, Link as LinkIcon, Pencil, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CONTENT_KINDS, openContent } from '@/lib/mentorContents'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContentDialog } from '@/routes/admin/components/ContentDialog'
import type { MentorContent, MentorContentKind } from '@/types/database'

// Conteúdos de produção da mentora — só a equipa vê esta página.
export function AdminContents() {
  const queryClient = useQueryClient()
  const [kind, setKind] = React.useState<MentorContentKind>('slides')
  const [dialog, setDialog] = React.useState<{ open: boolean; content: MentorContent | null }>({
    open: false,
    content: null,
  })

  const { data: contents, isLoading } = useQuery({
    queryKey: ['admin-mentor-contents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mentor_contents').select('*')
      if (error) throw error
      return data as MentorContent[]
    },
  })

  const visible = (contents ?? [])
    .filter((c) => c.kind === kind)
    .sort((a, b) => a.title.localeCompare(b.title, 'pt', { sensitivity: 'base', numeric: true }))
  const kindLabel = CONTENT_KINDS.find((k) => k.value === kind)!.label

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Conteúdos</h1>
          <p className="text-sm text-fg-muted">Slides, ferramentas e scripts das aulas. Só a equipa vê esta página.</p>
        </div>
        <Button onClick={() => setDialog({ open: true, content: null })}>
          <Plus className="size-4" />
          Novo conteúdo
        </Button>
      </div>

      <Tabs value={kind} onValueChange={(v) => setKind(v as MentorContentKind)}>
        <TabsList>
          {CONTENT_KINDS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label} ({(contents ?? []).filter((c) => c.kind === value).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="size-6" />
        </div>
      ) : visible.length === 0 ? (
        <Card className="flex items-center gap-3 px-4 py-6 text-sm text-fg-muted">
          <FolderOpen className="size-5 shrink-0" />
          Ainda não há {kindLabel.toLowerCase()}.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((content) => {
            const Icon = content.url ? LinkIcon : FileText
            return (
              <div
                key={content.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => openContent(content)}
                    className="truncate text-left text-sm font-medium text-fg hover:text-primary hover:underline"
                  >
                    {content.title}
                  </button>
                  {content.description && (
                    <p className="line-clamp-3 text-xs text-fg-muted">{content.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDialog({ open: true, content })}
                  className="rounded-md p-1.5 text-fg-muted hover:bg-border/40 hover:text-fg"
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <ContentDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
        content={dialog.content}
        defaultKind={kind}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-mentor-contents'] })}
      />
    </div>
  )
}
