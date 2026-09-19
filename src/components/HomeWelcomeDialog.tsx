import * as React from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useHomeWelcomeSettings } from '@/components/HomeWelcome'

export function HomeWelcomeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { data: settings } = useHomeWelcomeSettings()
  const [mentoriaName, setMentoriaName] = React.useState('')
  const [body, setBody] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open && settings) {
      setMentoriaName(settings.mentoriaName)
      setBody(settings.body)
    }
  }, [open, settings])

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('app_settings').upsert(
      [
        { key: 'home_mentoria_name', value: mentoriaName },
        { key: 'home_welcome_body', value: body },
      ],
      { onConflict: 'key' },
    )
    setSaving(false)
    if (error) {
      toast.error('Não foi possível guardar.')
      return
    }
    toast.success('Mensagem de boas-vindas atualizada.')
    queryClient.invalidateQueries({ queryKey: ['home-welcome-settings'] })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar boas-vindas do Início</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="welcome-mentoria-name">Nome da mentoria</Label>
            <Input
              id="welcome-mentoria-name"
              value={mentoriaName}
              onChange={(e) => setMentoriaName(e.target.value)}
            />
            <p className="text-xs text-fg-muted">
              Aparece assim: "{'{Nome do aluno}'}, sê muito bem-vindo(a) à Mentoria{' '}
              {mentoriaName || '…'}!"
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="welcome-body">Texto de boas-vindas</Label>
            <Textarea id="welcome-body" className="min-h-32" value={body} onChange={(e) => setBody(e.target.value)} />
            <p className="text-xs text-fg-muted">
              Visível no Início de cada aluno, logo a seguir ao título.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !mentoriaName.trim()}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
