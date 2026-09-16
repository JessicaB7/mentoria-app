import * as React from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RichTextarea } from '@/components/ui/rich-textarea'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useIndividualIntroSettings } from '@/components/IndividualIntro'

export function IndividualIntroDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { data: settings } = useIndividualIntroSettings()
  const [text, setText] = React.useState('')
  const [quote, setQuote] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open && settings) {
      setText(settings.text)
      setQuote(settings.quote)
    }
  }, [open, settings])

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('app_settings').upsert(
      [
        { key: 'individual_intro_text', value: text },
        { key: 'individual_intro_quote', value: quote },
      ],
      { onConflict: 'key' },
    )
    setSaving(false)
    if (error) {
      toast.error('Não foi possível guardar. Confirma que já correste a migração 0024 no Supabase.')
      return
    }
    toast.success('Texto de introdução atualizado.')
    queryClient.invalidateQueries({ queryKey: ['individual-intro-settings'] })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar introdução do Acompanhamento Individual</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intro-text">Texto de introdução</Label>
            <RichTextarea id="intro-text" className="min-h-32" value={text} onChange={setText} />
            <p className="text-xs text-fg-muted">Visível no topo, para todos os alunos.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intro-quote">Frase inspiracional</Label>
            <Textarea id="intro-quote" value={quote} onChange={(e) => setQuote(e.target.value)} />
          </div>
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
