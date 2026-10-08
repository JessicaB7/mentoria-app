import * as React from 'react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, Upload, Link as LinkIcon, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadFile, removeFile } from '@/lib/storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RichTextarea } from '@/components/ui/rich-textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { SESSION_TYPE_LABELS } from '@/lib/sessionType'
import type { Lesson, Material, ModuleCategory, Profile, SessionRecording, SessionType } from '@/types/database'

const NO_STUDENT = '__none__'
const NO_SESSION_TYPE = '__none__'

interface LessonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: string | null
  category: ModuleCategory
  lesson: Lesson | null
  nextPosition: number
  onSaved: () => void
  defaultStudentId?: string | null
}

export function LessonDialog({
  open,
  onOpenChange,
  moduleId,
  category,
  lesson,
  nextPosition,
  onSaved,
  defaultStudentId,
}: LessonDialogProps) {
  const queryClient = useQueryClient()
  const [currentLessonId, setCurrentLessonId] = React.useState<string | null>(lesson?.id ?? null)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [duration, setDuration] = React.useState('')
  const [published, setPublished] = React.useState(true)
  const [videoPath, setVideoPath] = React.useState<string | null>(null)
  const [studentId, setStudentId] = React.useState<string | null>(null)
  const [sessionDate, setSessionDate] = React.useState('')
  const [sessionType, setSessionType] = React.useState<SessionType | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [uploadingVideo, setUploadingVideo] = React.useState(false)
  const [recordingTitle, setRecordingTitle] = React.useState('')
  const [recordingUrl, setRecordingUrl] = React.useState('')
  const [recordingDate, setRecordingDate] = React.useState('')
  const [editingRecordingId, setEditingRecordingId] = React.useState<string | null>(null)
  // Sessões individuais: uma única gravação (link para a pasta da Drive), guardada em session_recordings
  const [recordingLink, setRecordingLink] = React.useState('')
  const [externalUrl, setExternalUrl] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setCurrentLessonId(lesson?.id ?? null)
      setTitle(lesson?.title ?? '')
      setDescription(lesson?.description ?? '')
      setDuration(lesson?.duration_minutes ? String(lesson.duration_minutes) : '')
      setPublished(lesson?.published ?? true)
      setVideoPath(lesson?.video_path ?? null)
      setExternalUrl(lesson?.external_url ?? '')
      setStudentId(lesson?.student_id ?? defaultStudentId ?? null)
      setSessionDate(lesson?.session_date ?? '')
      setSessionType(lesson?.session_type ?? null)
      resetRecordingForm()
    }
  }, [open, lesson, defaultStudentId])

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
    enabled: !!currentLessonId && (category === 'ao_vivo' || category === 'individual'),
  })

  React.useEffect(() => {
    if (open && category === 'individual') setRecordingLink(recordings?.[0]?.url ?? '')
  }, [open, category, recordings])

  async function handleSaveDetails() {
    if (!title.trim()) return
    setSaving(true)
    const payload = {
      title,
      description,
      duration_minutes: duration ? Number(duration) : null,
      published,
      video_path: videoPath,
      external_url: category === 'modulo' ? externalUrl.trim() || null : null,
      student_id: category === 'individual' ? studentId : null,
      session_date:
        category === 'individual' || category === 'ao_vivo' ? sessionDate || null : null,
      session_type: category === 'ao_vivo' ? sessionType : null,
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
    const savedId = (data as Lesson).id
    if (category === 'individual' && !(await saveRecordingLink(savedId))) {
      toast.error('A aula foi guardada, mas não foi possível guardar a gravação.')
      return
    }
    setCurrentLessonId(savedId)
    toast.success('Aula guardada.')
    onSaved()
  }

  async function saveRecordingLink(lessonId: string) {
    const link = recordingLink.trim()
    const existing = recordings?.[0]
    const { error } = existing
      ? link
        ? await supabase.from('session_recordings').update({ url: link }).eq('id', existing.id)
        : await supabase.from('session_recordings').delete().eq('id', existing.id)
      : link
        ? await supabase
            .from('session_recordings')
            .insert({ lesson_id: lessonId, title: 'Ver gravação', url: link, position: 0 })
        : { error: null }
    if (!error) refetchRecordings()
    return !error
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
    } catch (err) {
      toast.error(`Falha ao carregar o material: ${(err as Error).message}`)
    } finally {
      e.target.value = ''
    }
  }

  async function handleMaterialDelete(material: Material) {
    await removeFile('materials', material.file_path)
    await supabase.from('materials').delete().eq('id', material.id)
    refetchMaterials()
  }

  function resetRecordingForm() {
    setEditingRecordingId(null)
    setRecordingTitle('')
    setRecordingUrl('')
    setRecordingDate('')
  }

  function handleRecordingEdit(recording: SessionRecording) {
    setEditingRecordingId(recording.id)
    setRecordingTitle(recording.title)
    setRecordingUrl(recording.url)
    setRecordingDate(recording.session_date ?? '')
  }

  async function handleRecordingSave() {
    if (!currentLessonId || !recordingTitle.trim() || !recordingUrl.trim()) return
    const fields = {
      title: recordingTitle.trim(),
      url: recordingUrl.trim(),
      session_date: recordingDate || null,
    }
    const { error } = editingRecordingId
      ? await supabase.from('session_recordings').update(fields).eq('id', editingRecordingId)
      : await supabase
          .from('session_recordings')
          .insert({ ...fields, lesson_id: currentLessonId, position: recordings?.length ?? 0 })
    if (error) {
      toast.error(editingRecordingId ? 'Não foi possível guardar a gravação.' : 'Não foi possível adicionar a gravação.')
      return
    }
    toast.success(editingRecordingId ? 'Gravação atualizada.' : 'Gravação adicionada.')
    resetRecordingForm()
    refetchRecordings()
  }

  async function handleRecordingDelete(recording: SessionRecording) {
    await supabase.from('session_recordings').delete().eq('id', recording.id)
    if (recording.id === editingRecordingId) resetRecordingForm()
    refetchRecordings()
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] })
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] })
      queryClient.invalidateQueries({ queryKey: ['live-recordings'] })
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
                <Label htmlFor="lesson-description">{category === 'modulo' ? 'Notas' : 'Descrição'}</Label>
                <RichTextarea
                  id="lesson-description"
                  className="min-h-40"
                  value={description}
                  onChange={setDescription}
                />
              </div>
              {category === 'ao_vivo' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lesson-session-type">Tipo de sessão</Label>
                  <Select
                    value={sessionType ?? NO_SESSION_TYPE}
                    onValueChange={(v) =>
                      setSessionType(v === NO_SESSION_TYPE ? null : (v as SessionType))
                    }
                  >
                    <SelectTrigger id="lesson-session-type">
                      <SelectValue placeholder="Normal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SESSION_TYPE}>Normal</SelectItem>
                      {(Object.entries(SESSION_TYPE_LABELS) as [SessionType, string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-fg-muted">
                    Dá destaque a sessões fora do padrão (ex.: boas-vindas, convidado).
                  </p>
                </div>
              )}
              {(category === 'individual' || category === 'ao_vivo') && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lesson-session-date">Data da sessão</Label>
                  <Input
                    id="lesson-session-date"
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                  />
                  {category === 'ao_vivo' && (
                    <p className="text-xs text-fg-muted">
                      Opcional — deixa em branco para aulas sem data própria (ex.: "Como funcionam
                      os Hot Seats"). Aulas com data aparecem em destaque como próxima sessão.
                    </p>
                  )}
                </div>
              )}
              {category === 'individual' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lesson-student">Aluno</Label>
                  <Select
                    value={studentId ?? NO_STUDENT}
                    onValueChange={(v) => setStudentId(v === NO_STUDENT ? null : v)}
                  >
                    <SelectTrigger id="lesson-student">
                      <SelectValue placeholder="Escolhe o aluno…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_STUDENT}>Nenhum — visível para todos os alunos</SelectItem>
                      {(students ?? []).map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} · {student.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-fg-muted">
                    Sem aluno escolhido, a aula fica visível a todos os alunos — usa isto para explicar,
                    por exemplo, as regras de agendamento das sessões individuais.
                  </p>
                </div>
              )}
              {category === 'ao_vivo' && (
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
              )}
              {category === 'individual' ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lesson-recording-link">Gravação</Label>
                  <Input
                    id="lesson-recording-link"
                    placeholder="https://drive.google.com/…"
                    value={recordingLink}
                    onChange={(e) => setRecordingLink(e.target.value)}
                  />
                  <p className="text-xs text-fg-muted">Link para a pasta da Drive com a gravação da sessão.</p>
                </div>
              ) : (
                <>
                {category === 'modulo' && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lesson-external-url">Link da aula</Label>
                    <Input
                      id="lesson-external-url"
                      type="url"
                      placeholder="https://…"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                    />
                    <p className="text-xs text-fg-muted">
                      Se preencheres, ao clicar na aula a aluna é levada para este link (abre num separador novo).
                    </p>
                  </div>
                )}
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
              </>
              )}
              <div className="flex items-center gap-2">
                <Switch checked={published} onCheckedChange={setPublished} id="lesson-published" />
                <Label htmlFor="lesson-published">Visível para alunos</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Fechar
              </Button>
              <Button onClick={handleSaveDetails} disabled={saving || !title.trim()}>
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
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="recording-date">Data da sessão</Label>
                  <Input
                    id="recording-date"
                    type="date"
                    value={recordingDate}
                    onChange={(e) => setRecordingDate(e.target.value)}
                  />
                  <p className="text-xs text-fg-muted">Aparece na galeria de gravações do aluno.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    disabled={!recordingTitle.trim() || !recordingUrl.trim()}
                    onClick={handleRecordingSave}
                  >
                    <LinkIcon className="size-4" />
                    {editingRecordingId ? 'Guardar alterações' : 'Adicionar gravação'}
                  </Button>
                  {editingRecordingId && (
                    <Button type="button" variant="ghost" size="sm" onClick={resetRecordingForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
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
                        {recording.session_date && (
                          <span className="ml-2 text-xs text-fg-muted">
                            {new Date(recording.session_date + 'T00:00:00').toLocaleDateString('pt-PT')}
                          </span>
                        )}
                      </a>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleRecordingEdit(recording)}
                          className="text-fg-muted hover:text-fg"
                          aria-label="Editar gravação"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleRecordingDelete(recording)}
                          className="text-fg-muted hover:text-danger"
                          aria-label="Apagar gravação"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
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
