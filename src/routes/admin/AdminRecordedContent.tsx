import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ModuleDialog } from '@/routes/admin/components/ModuleDialog'
import { ModuleCardGrid, type ModuleWithLessons } from '@/routes/admin/components/ModuleCardGrid'
import type { Module } from '@/types/database'

export function AdminRecordedContent() {
  const queryClient = useQueryClient()
  const [moduleDialogOpen, setModuleDialogOpen] = React.useState(false)
  const [editingModule, setEditingModule] = React.useState<Module | null>(null)

  const { data: modules, isLoading } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .order('position', { ascending: true })
      if (error) throw error
      const typed = data as unknown as ModuleWithLessons[]
      typed.forEach((m) => m.lessons.sort((a, b) => a.position - b.position))
      return typed
    },
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['admin-modules'] })
  }

  async function deleteModule(e: React.MouseEvent, module: Module) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Eliminar o módulo "${module.title}" e todas as suas aulas?`)) return
    const { error } = await supabase.from('modules').delete().eq('id', module.id)
    if (error) {
      toast.error('Não foi possível eliminar o módulo.')
      return
    }
    toast.success('Módulo eliminado.')
    refresh()
  }

  function editModule(e: React.MouseEvent, module: Module) {
    e.preventDefault()
    e.stopPropagation()
    setEditingModule(module)
    setModuleDialogOpen(true)
  }

  if (isLoading || !modules) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Conteúdo gravado</h1>
          <p className="text-sm text-fg-muted">O currículo principal, organizado por módulos.</p>
        </div>
        <Button
          onClick={() => {
            setEditingModule(null)
            setModuleDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          Novo módulo
        </Button>
      </div>

      {modules.length > 0 ? (
        <ModuleCardGrid modules={modules} onEdit={editModule} onDelete={deleteModule} />
      ) : (
        <p className="text-sm text-fg-muted">Ainda não criaste nenhum módulo.</p>
      )}

      <ModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        module={editingModule}
        nextPosition={modules.length}
        onSaved={refresh}
      />
    </div>
  )
}
