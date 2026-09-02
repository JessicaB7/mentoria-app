import * as React from 'react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, Upload, Link as LinkIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadFile, removeFile } from '@/lib/storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import type { Lesson, Material, ModuleCategory, Profile, SessionRecording } from '@/types/database'

interface LessonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: string | null
  category: ModuleCategory
  lesson: Lesson | null
  nextPosition: number
  onSaved: () => void
}

export function LessonDialog({
  open,
  onOpenChange,
  moduleId,
  category,
  lesson,
  nextPosition,
  onSaved,
}: LessonDialogProps) {
  const queryClient = useQueryClient()
  const [currentLessonId, setCurrentLessonId] = React.useState<string | null>(lesson?.id ?? null)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [duration, setDuration] = React.useState('')
  const [published, setPublished] = React.useState(true)
  const [videoPath, setVideoPath] = React.useState<string | null>(null)
  const [studentId, setStudentId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [uploadingVideo, setUploadingVideo] = React.useState(false)
  const [recordingTitle, setRecordingTitle] = React.useState('')
  const [recordingUrl, setRecordingUrl] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setCurrentLessonId(lesson?.id ?? null)
      setTitle(lesson?.title ?? '')
      setDescription(lesson?.description ?? '')
      setDuration(lesson?.duration_minutes ? String(lesson.duration_minutes) : '')
      setPublished(lesson?.published ?? true)
      setVideoPath(lesson?.video_path ?? null)
      setStudentId(lesson?.student_id ?? null)
    }
  }, [open, lesson])

  const { data: students } = useQuery({
    queryKey: ['students-for-lesson'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name', { ascending: true })
      if (error) throw error
      return data as Profile[]
    },
    enabled: open && category === 'individual',
  })

  const { data: materials, refetch: refetchMaterials } = useQuery({
    queryKey: ['materials', currentLessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('lesson_id', currentLessonId!)
      if (error) throw error
      return data as Material[]
    },
    enabled: !!currentLessonId,
  })

  const { data: recordings, refetch: refetchRecordings } = useQuery({
    queryKey: ['session-recordings', currentLessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_recordings')
        .select('*')
        .eq('lesson_id', currentLessonId!)
        .order('position', { ascending: true })
      if (error) throw error
      return data as SessionRecording[]
    },
    enabled: !!currentLessonId && category === 'ao_vivo',
  })

  async function handleSaveDetails() {
    if (!title.trim()) return
    if (category === 'individual' && !studentId) {
      toast.error('Escolhe o aluno a quem esta aula fica atribuída.')
      return
    }
    setSaving(true)
    const payload = {
      title,
      description,
      duration_minutes: duration ? Number(duration) : null,
      published,
      video_path: videoPath,
      student_id: category === 'individual' ? studentId : null,
    }
    const { data, error } = currentLessonId
      ? await supabase.from('lessons').update(payload).eq('id', currentLessonId).select().single()
      : await supabase
          .from('lessons')
          .insert({ ...payload, module_id: moduleId, category, position: nextPosition })
          .select()
          .single()
    setSaving(false)
    if (error || !data) {
      toast.error('Não foi possível guardar a aula.')
      return
    }
    setCurrentLessonId((data as Lesson).id)
    toast.success('Aula guardada.')
    onSaved()
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingVideo(true)
    try {
      if (videoPath) await removeFile('lesson-videos', videoPath)
      const path = await uploadFile('lesson-videos', file)
      setVideoPath(path)
      toast.success('Vídeo carregado. Não te esqueças de guardar.')
    } catch {
      toast.error('Falha ao carregar o vídeo.')
    } finally {
      setUploadingVideo(false)
      e.target.value = ''
    }
  }

  async function handleMaterialUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentLessonId) return
    try {
      const path = await uploadFile('materials', file)
      const { error } = await supabase.from('materials').insert({
        lesson_id: currentLessonId,
        title: file.name,
        file_path: path,
        file_type: file.type,
      })
      if (error) throw error
      toast.success('Material adicionado.')
      refetchMaterials()
    } catch {
      toast.error('Falha ao carregar o material.')
    } finally {
      e.target.value = ''
    }
  }

  async function handleMaterialDelete(material: Material) {
    await removeFile('materials', material.file_path)
    await supabase.from('materials').delete().eq('id', material.id)
    refetchMaterials()
  }

  async function handleRecordingAdd() {
    if (!currentLessonId || !recordingTitle.trim() || !recordingUrl.trim()) return
    const { error } = await supabase.from('session_recordings').insert({
      lesson_id: currentLessonId,
      title: recordingTitle.trim(),
      url: recordingUrl.trim(),
      position: recordings?.length ?? 0,
    })
    if (error) {
      toast.error('Não foi possível adicionar a gravação.')
      return
    }
    setRecordingTitle('')
    setRecordingUrl('')
    toast.success('Gravação adicionada.')
    refetchRecordings()
  }

  async function handleRecordingDelete(recording: SessionRecording) {
    await supabase.from('session_recordings').delete().eq('id', recording.id)
    refetchRecordings()
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] })
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] })
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{lesson ? 'Editar aula' : 'Nova aula'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="detalhes">
          <TabsList>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="materiais" disabled={!currentLessonId}>
              Materiais
            </TabsTrigger>
            {category === 'ao_vivo' && (
              <TabsTrigger value="gravacoes" disabled={!currentLessonId}>
                Gravações
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="detalhes">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lesson-title">Título</Label>
                <Input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lesson-description">Descrição</Label>
                <Textarea
                  id="lesson-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              {category === 'individual' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lesson-student">Aluno</Label>
                  <Select value={studentId ?? undefined} onValueChange={setStudentId}>
                    <SelectTrigger id="lesson-student">
                      <SelectValue placeholder="Escolhe o aluno…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(students ?? []).map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} · {student.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lesson-duration">Duração (minutos)</Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  min={0}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Vídeo</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      {uploadingVideo ? <Spinner /> : <Upload className="size-4" />}
                      {videoPath ? 'Substituir vídeo' : 'Carregar vídeo'}
                      <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                    </label>
                  </Button>
                  {videoPath && <span className="text-xs text-fg-muted">Vídeo carregado</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={published} onCheckedChange={setPublished} id="lesson-published" />
                <Label htmlFor="lesson-published">Publicada (visível para alunos)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Fechar
              </Button>
              <Button
                onClick={handleSaveDetails}
                disabled={saving || !title.trim() || (category === 'individual' && !studentId)}
              >
                Guardar
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="materiais">
            <div className="flex flex-col gap-3">
              <Button type="button" variant="outline" size="sm" asChild className="w-fit">
                <label className="cursor-pointer">
                  <Upload className="size-4" />
                  Adicionar material
                  <input type="file" className="hidden" onChange={handleMaterialUpload} />
                </label>
              </Button>
              <div className="flex flex-col divide-y divide-border">
                {(materials ?? []).map((material) => (
                  <div key={material.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-fg">{material.title}</span>
                    <button
                      onClick={() => handleMaterialDelete(material)}
                      className="text-fg-muted hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                {(materials ?? []).length === 0 && (
                  <p className="py-2 text-sm text-fg-muted">Sem materiais ainda.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {category === 'ao_vivo' && (
            <TabsContent value="gravacoes">
              <div className="flex flex-col gap-3">
                <p className="text-xs text-fg-muted">
                  Adiciona uma secção por sessão (ex.: "Sessão 7 de outubro") com o link da gravação
                  (Zoom, Google Drive, YouTube, etc.).
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="recording-title">Título da sessão</Label>
                  <Input
                    id="recording-title"
                    placeholder="Ex.: Sessão 7 de outubro"
                    value={recordingTitle}
                    onChange={(e) => setRecordingTitle(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="recording-url">Link da gravação</Label>
                  <Input
                    id="recording-url"
                    placeholder="https://…"
                    value={recordingUrl}
                    onChange={(e) => setRecordingUrl(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  disabled={!recordingTitle.trim() || !recordingUrl.trim()}
                  onClick={handleRecordingAdd}
                >
                  <LinkIcon className="size-4" />
                  Adicionar gravação
                </Button>
                <div className="flex flex-col divide-y divide-border">
                  {(recordings ?? []).map((recording) => (
                    <div key={recording.id} className="flex items-center justify-between py-2">
                      <a
                        href={recording.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-fg hover:underline"
                      >
                        {recording.title}
                      </a>
                      <button
                        onClick={() => handleRecordingDelete(recording)}
                        className="text-fg-muted hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  {(recordings ?? []).length === 0 && (
                    <p className="py-2 text-sm text-fg-muted">Sem gravações ainda.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
