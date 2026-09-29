import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/spinner'
import { ToolsGrid } from '@/components/ToolsGrid'
import type { Tool } from '@/types/database'

export function StudentTools() {
  const { data: tools, isLoading } = useQuery({
    queryKey: ['student-tools'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tools').select('*').eq('published', true)
      if (error) throw error
      return data as Tool[]
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Ferramentas</h1>
        <p className="text-sm text-fg-muted">Ferramentas e templates prontos a usar no teu dia a dia.</p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="size-6" />
        </div>
      ) : (
        <ToolsGrid tools={tools ?? []} />
      )}
    </div>
  )
}
