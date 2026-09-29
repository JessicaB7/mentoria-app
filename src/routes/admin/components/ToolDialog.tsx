import * as React from 'react'
import { toast } from 'sonner'
import { Trash2, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadFile, removeFile } from '@/lib/storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { openTool } from '@/components/ToolsGrid'
import type { Tool } from '@/types/database'

type Kind = 'ficheiro' | 'link'

interface ToolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool: Tool | null
  categories: string[]
  onSaved: () => void
}

export function ToolDialog({ open, onOpenChange, tool, categories, onSaved }: ToolDialogProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [kind, setKind] = React.useState<Kind>('ficheiro')
  const [url, setUrl] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [published, setPublished] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setTitle(tool?.title ?? '')
      setDescription(tool?.description ?? '')
      setCategory(tool?.category ?? '')
      setKind(tool?.url ? 'link' : 'ficheiro')
      setUrl(tool?.url ?? '')
      setFile(null)
      setPublished(tool?.published ?? true)
    }
  }, [open, tool])

  const hasFile = !!file || !!tool?.file_path
  const canSave = !!title.trim() && (kind === 'link' ? !!url.trim() : hasFile)

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      let filePath = tool?.file_path ?? null
      let fileType = tool?.file_type ?? null
      if (kind === 'ficheiro' && file) {
        filePath = await uploadFile('materials', file)
        fileType = file.type || null
      }
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        published,
        url: kind === 'link' ? url.trim() : null,
        file_path: kind === 'ficheiro' ? filePath : null,
        file_type: kind === 'ficheiro' ? fileType : null,
      }
      const { error } = tool
        ? await supabase.from('tools').update(payload).eq('id', tool.id)
        : await supabase.from('tools').insert(payload)
      if (error) throw error
      // Ficheiro antigo substituído (ou trocado por link) deixa de ser usado
      if (tool?.file_path && tool.file_path !== payload.file_path) {
        await removeFile('materials', tool.file_path)
      }
      toast.success('Ferramenta guardada.')
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error('Não foi possível guardar a ferramenta.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!tool) return
    const { error } = await supabase.from('tools').delete().eq('id', tool.id)
    if (error) {
      toast.error('Não foi possível apagar a ferramenta.')
      return
    }
    if (tool.file_path) await removeFile('materials', tool.file_path)
    toast.success('Ferramenta apagada.')
    onSaved()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{tool ? 'Editar ferramenta' : 'Nova ferramenta'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tool-title">Título</Label>
            <Input id="tool-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tool-description">Descrição</Label>
            <Textarea
              id="tool-description"
              placeholder="Para que serve e como usar."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tool-category">Categoria</Label>
            <Input
              id="tool-category"
              list="tool-categories"
              placeholder="Ex.: Templates, Folhas de cálculo, Checklists"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="tool-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <p className="text-xs text-fg-muted">Opcional — agrupa as ferramentas na página do aluno.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Conteúdo</Label>
            <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
              <TabsList>
                <TabsTrigger value="ficheiro">Ficheiro</TabsTrigger>
                <TabsTrigger value="link">Link</TabsTrigger>
              </TabsList>
            </Tabs>
            {kind === 'ficheiro' ? (
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
                  tool?.file_path && (
                    <button
                      type="button"
                      onClick={() => openTool(tool)}
                      className="text-xs text-primary hover:underline"
                    >
                      Ver ficheiro atual
                    </button>
                  )
                )}
              </div>
            ) : (
              <Input
                placeholder="https://… (Google Drive, Notion, Canva, etc.)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={published} onCheckedChange={setPublished} id="tool-published" />
            <Label htmlFor="tool-published">Publicada (visível para alunos)</Label>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {tool ? (
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
