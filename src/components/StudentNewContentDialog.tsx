import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, PlayCircle, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type NewModule = { id: string; title: string }
type NewLesson = { id: string; title: string; module_id: string | null; category: string; modules: { title: string } | null }

// Pop-up ao abrir a app com as aulas e módulos que ficaram disponíveis desde a última vez que o aluno o fechou.
export function StudentNewContentDialog() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = React.useState(false)
  const isStudent = profile?.role === 'student'
  const seenAt = profile?.content_seen_at ?? null

  const markSeen = React.useCallback(async () => {
    if (!profile) return
    await supabase.from('profiles').update({ content_seen_at: new Date().toISOString() }).eq('id', profile.id)
    await refreshProfile()
  }, [profile, refreshProfile])

  // Primeira vez: começa a contar a partir de agora, para não mostrar todo o conteúdo antigo como novo.
  const initialized = React.useRef(false)
  React.useEffect(() => {
    if (!isStudent || seenAt || initialized.current) return
    initialized.current = true
    markSeen()
  }, [isStudent, seenAt, markSeen])

  const { data } = useQuery({
    queryKey: ['student-new-content', profile?.id, seenAt],
    enabled: isStudent && !!seenAt,
    queryFn: async () => {
      const [{ data: modules, error: modulesError }, { data: lessons, error: lessonsError }] = await Promise.all([
        supabase
          .from('modules')
          .select('id, title')
          .eq('published', true)
          .eq('category', 'modulo')
          .gt('published_at', seenAt!)
          .order('position', { ascending: true }),
        supabase
          .from('lessons')
          .select('id, title, module_id, category, modules(title, published)')
          .eq('published', true)
          .in('category', ['modulo', 'individual'])
          .gt('published_at', seenAt!)
          .order('position', { ascending: true }),
      ])
      if (modulesError) throw modulesError
      if (lessonsError) throw lessonsError
      const newModules = (modules ?? []) as NewModule[]
      const newModuleIds = new Set(newModules.map((m) => m.id))
      // As aulas de um módulo novo já vêm "dentro" dele; as de módulos ainda ocultos não contam.
      const newLessons = ((lessons ?? []) as unknown as (NewLesson & { modules: { published: boolean } | null })[]).filter(
        (l) => !l.module_id || (l.modules?.published && !newModuleIds.has(l.module_id)),
      )
      return { modules: newModules, lessons: newLessons as NewLesson[] }
    },
  })

  const total = (data?.modules.length ?? 0) + (data?.lessons.length ?? 0)
  const open = isStudent && !dismissed && total > 0

  function close() {
    setDismissed(true)
    markSeen()
  }

  function go(to: string) {
    close()
    navigate(to)
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="size-5" />
          </div>
          <DialogTitle>Há novidades na mentoria!</DialogTitle>
          <DialogDescription>
            {total === 1 ? 'Ficou disponível um novo conteúdo para ti.' : 'Ficaram disponíveis novos conteúdos para ti.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {data?.modules.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => go(`/aluno/modulos/${m.id}`)}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <BookOpen className="size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">Novo módulo</p>
                <p className="truncate text-sm font-semibold text-fg">{m.title}</p>
              </div>
            </button>
          ))}
          {data?.lessons.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => go(`/aluno/aulas/${l.id}`)}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <PlayCircle className="size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  {l.category === 'individual' ? 'Nova aula individual' : 'Nova aula'}
                </p>
                <p className="truncate text-sm font-semibold text-fg">{l.title}</p>
                {l.modules?.title && <p className="truncate text-xs text-fg-muted">{l.modules.title}</p>}
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={close}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
