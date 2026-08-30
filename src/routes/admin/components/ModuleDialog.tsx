import * as React from 'react'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadFile, removeFile, getPublicUrl } from '@/lib/storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import type { Module } from '@/types/database'

interface ModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  module: Module | null
  nextPosition: number
  onSaved: () => void
}

export function ModuleDialog({ open, onOpenChange, module, nextPosition, onSaved }: ModuleDialogProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [coverPath, setCoverPath] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [uploadingCover, setUploadingCover] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setTitle(module?.title ?? '')
      setDescription(module?.description ?? '')
      setCoverPath(module?.cover_path ?? null)
    }
  }, [open, module])

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      if (coverPath) await removeFile('module-covers', coverPath)
      const path = await uploadFile('module-covers', file)
      setCoverPath(path)
    } catch {
      toast.error('Falha ao carregar a capa.')
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    const payload = { title, description, cover_path: coverPath }
    const { error } = module
      ? await supabase.from('modules').update(payload).eq('id', module.id)
      : await supabase.from('modules').insert({ ...payload, position: nextPosition })
    setSaving(false)
    if (error) {
      toast.error('Não foi possível guardar o módulo.')
      return
    }
    toast.success('Módulo guardado.')
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{module ? 'Editar módulo' : 'Novo módulo'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="module-title">Título</Label>
            <Input id="module-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="module-description">Descrição</Label>
            <Textarea
              id="module-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Capa</Label>
            {coverPath && (
              <img
                src={getPublicUrl('module-covers', coverPath)}
                alt=""
                className="h-24 w-full rounded-md object-cover"
              />
            )}
            <Button type="button" variant="outline" size="sm" asChild className="w-fit">
              <label className="cursor-pointer">
                {uploadingCover ? <Spinner /> : <Upload className="size-4" />}
                {coverPath ? 'Substituir capa' : 'Carregar capa'}
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </label>
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
