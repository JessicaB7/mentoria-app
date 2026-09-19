import * as React from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadFile, removeFile } from '@/lib/storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
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
  const [mentorNote, setMentorNote] = React.useState('')
  const [coverPath, setCoverPath] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [uploadingCover, setUploadingCover] = React.useState(false)

  React.useEffect(() => {
    if (open && settings) {
      setMentoriaName(settings.mentoriaName)
      setBody(settings.body)
      setMentorNote(settings.mentorNote)
      setCoverPath(settings.coverPath)
    }
  }, [open, settings])

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      if (coverPath) await removeFile('module-covers', coverPath)
      const path = await uploadFile('module-covers', file)
      setCoverPath(path)
    } catch {
      toast.error('Falha ao carregar a imagem.')
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('app_settings').upsert(
      [
        { key: 'home_mentoria_name', value: mentoriaName },
        { key: 'home_welcome_body', value: body },
        { key: 'home_mentor_note', value: mentorNote },
        { key: 'home_cover_path', value: coverPath },
      ],
      { onConflict: 'key' },
    )
    setSaving(false)
    if (error) {
      toast.error('Não foi possível guardar.')
      return
    }
    toast.success('Início do aluno atualizado.')
    queryClient.invalidateQueries({ queryKey: ['home-welcome-settings'] })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Início do aluno</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
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
            <Textarea id="welcome-body" className="min-h-24" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="welcome-mentor-note">Nota da mentora (opcional)</Label>
            <Textarea
              id="welcome-mentor-note"
              placeholder="Ex.: Esta semana, foca-te em fechar a tua tabela de preços — falamos disso na próxima sessão."
              value={mentorNote}
              onChange={(e) => setMentorNote(e.target.value)}
            />
            <p className="text-xs text-fg-muted">
              Um recado pessoal e atual, para todos os alunos. Deixa em branco para não mostrar.
              {settings?.mentorNoteUpdatedAt &&
                ` Última atualização: ${new Date(settings.mentorNoteUpdatedAt).toLocaleDateString('pt-PT')}.`}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Imagem de capa (opcional)</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  {uploadingCover ? <Spinner /> : <Upload className="size-4" />}
                  {coverPath ? 'Substituir imagem' : 'Carregar imagem'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </label>
              </Button>
              {coverPath && <span className="text-xs text-fg-muted">Imagem carregada</span>}
            </div>
            <p className="text-xs text-fg-muted">
              Substitui o fundo do cartão de boas-vindas por esta imagem.
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
