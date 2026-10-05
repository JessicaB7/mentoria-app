import * as React from 'react'
import { toast } from 'sonner'
import { Trash2, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadFile, removeFile } from '@/lib/storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { openContent, type ContentKindOption } from '@/lib/mentorContents'
import type { MentorContent, MentorContentKind } from '@/types/database'

type Source = 'ficheiro' | 'link'

interface ContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: MentorContent | null
  kinds: ContentKindOption[]
  defaultKind: MentorContentKind
  onSaved: () => void
}

export function ContentDialog({ open, onOpenChange, content, kinds, defaultKind, onSaved }: ContentDialogProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [kind, setKind] = React.useState<MentorContentKind>(defaultKind)
  const [source, setSource] = React.useState<Source>('ficheiro')
  const [url, setUrl] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setTitle(content?.title ?? '')
      setDescription(content?.description ?? '')
      setKind(content?.kind ?? defaultKind)
      setSource(content?.url ? 'link' : 'ficheiro')
      setUrl(content?.url ?? '')
      setFile(null)
    }
  }, [open, content, defaultKind])

  const hasFile = !!file || !!content?.file_path
  const canSave = !!title.trim() && (source === 'link' ? !!url.trim() : hasFile)

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      let filePath = content?.file_path ?? null
      let fileType = content?.file_type ?? null
      if (source === 'ficheiro' && file) {
        filePath = await uploadFile('mentor-contents', file)
        fileType = file.type || null
      }
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        kind,
        url: source === 'link' ? url.trim() : null,
        file_path: source === 'ficheiro' ? filePath : null,
        file_type: source === 'ficheiro' ? fileType : null,
      }
      const { error } = content
        ? await supabase.from('mentor_contents').update(payload).eq('id', content.id)
        : await supabase.from('mentor_contents').insert(payload)
      if (error) throw error
      // Ficheiro antigo substituído (ou trocado por link) deixa de ser usado
      if (content?.file_path && content.file_path !== payload.file_path) {
        await removeFile('mentor-contents', content.file_path)
      }
      toast.success('Conteúdo guardado.')
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error('Não foi possível guardar o conteúdo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!content) return
    const { error } = await supabase.from('mentor_contents').delete().eq('id', content.id)
    if (error) {
      toast.error('Não foi possível apagar o conteúdo.')
      return
    }
    if (content.file_path) await removeFile('mentor-contents', content.file_path)
    toast.success('Conteúdo apagado.')
    onSaved()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{content ? 'Editar conteúdo' : 'Novo conteúdo'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content-title">Título</Label>
            <Input
              id="content-title"
              placeholder="Ex.: M1 · Aula 2 — Arquétipo de marca"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          {kinds.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="content-kind">Tipo</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as MentorContentKind)}>
                <SelectTrigger id="content-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kinds.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content-description">Notas</Label>
            <Textarea
              id="content-description"
              placeholder="Opcional — estado, aula a que pertence, o que falta fazer."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Conteúdo</Label>
            <Tabs value={source} onValueChange={(v) => setSource(v as Source)}>
              <TabsList>
                <TabsTrigger value="ficheiro">Ficheiro</TabsTrigger>
                <TabsTrigger value="link">Link</TabsTrigger>
              </TabsList>
            </Tabs>
            {source === 'ficheiro' ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    <Upload className="size-4" />
                    {hasFile ? 'Substituir ficheiro' : 'Carregar ficheiro'}
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        setFile(e.target.files?.[0] ?? null)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </Button>
                {file ? (
                  <span className="truncate text-xs text-fg-muted">{file.name}</span>
                ) : (
                  content?.file_path && (
                    <button
                      type="button"
                      onClick={() => openContent(content)}
                      className="text-xs text-primary hover:underline"
                    >
                      Ver ficheiro atual
                    </button>
                  )
                )}
              </div>
            ) : (
              <Input
                placeholder="https://… (Canva, Google Drive, Claude, etc.)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {content ? (
            <Button variant="outline" onClick={handleDelete} className="text-danger">
              <Trash2 className="size-4" />
              Apagar
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !canSave}>
              {saving && <Spinner />}
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
