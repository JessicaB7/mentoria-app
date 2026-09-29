import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ToolsGrid } from '@/components/ToolsGrid'
import { ToolDialog } from '@/routes/admin/components/ToolDialog'
import type { Tool } from '@/types/database'

export function AdminTools() {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = React.useState<{ open: boolean; tool: Tool | null }>({
    open: false,
    tool: null,
  })

  const { data: tools, isLoading } = useQuery({
    queryKey: ['admin-tools'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tools').select('*')
      if (error) throw error
      return data as Tool[]
    },
  })

  const categories = [...new Set((tools ?? []).map((t) => t.category?.trim()).filter(Boolean))] as string[]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Ferramentas</h1>
          <p className="text-sm text-fg-muted">Ferramentas e templates disponíveis para todos os alunos.</p>
        </div>
        <Button onClick={() => setDialog({ open: true, tool: null })}>
          <Plus className="size-4" />
          Nova ferramenta
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="size-6" />
        </div>
      ) : (
        <ToolsGrid tools={tools ?? []} onSelect={(tool) => setDialog({ open: true, tool })} />
      )}

      <ToolDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
        tool={dialog.tool}
        categories={categories}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-tools'] })}
      />
    </div>
  )
}
