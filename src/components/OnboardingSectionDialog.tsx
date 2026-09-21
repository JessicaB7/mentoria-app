import * as React from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RichTextarea } from '@/components/ui/rich-textarea'
import { Label } from '@/components/ui/label'
import { useOnboardingSectionSettings } from '@/components/OnboardingSection'

export function OnboardingSectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { data: settings } = useOnboardingSectionSettings()
  const [text, setText] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open && settings) {
      setText(settings.text)
    }
  }, [open, settings])

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('app_settings')
      .upsert([{ key: 'onboarding_section_text', value: text }], { onConflict: 'key' })
    setSaving(false)
    if (error) {
      toast.error('Não foi possível guardar.')
      return
    }
    toast.success('Onboarding atualizado.')
    queryClient.invalidateQueries({ queryKey: ['onboarding-section-settings'] })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Onboarding</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onboarding-text">Passos do onboarding</Label>
          <RichTextarea id="onboarding-text" className="min-h-64" value={text} onChange={setText} />
          <p className="text-xs text-fg-muted">
            Visível a todos os alunos que ainda não estão "Ativo", no Acompanhamento Individual.
            Os links (autenticacao.gov.pt, GoCardless) são texto simples — cola aqui os teus links
            reais se quiseres que fiquem clicáveis mais tarde.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !text.trim()}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
