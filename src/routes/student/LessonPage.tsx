import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSignedUrl } from '@/lib/storage'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { Lesson, Material } from '@/types/database'

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [marking, setMarking] = React.useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['lesson', lessonId, profile?.id],
    queryFn: async () => {
      const [{ data: lesson, error: lessonError }, { data: materials, error: materialsError }, { data: progress }] =
        await Promise.all([
          supabase.from('lessons').select('*').eq('id', lessonId!).single(),
          supabase.from('materials').select('*').eq('lesson_id', lessonId!),
          supabase
            .from('lesson_progress')
            .select('*')
            .eq('lesson_id', lessonId!)
            .eq('student_id', profile!.id)
            .maybeSingle(),
        ])
      if (lessonError) throw lessonError
      if (materialsError) throw materialsError

      const lessonTyped = lesson as Lesson
      const videoUrl = lessonTyped.video_path
        ? await getSignedUrl('lesson-videos', lessonTyped.video_path)
        : null

      return {
        lesson: lessonTyped,
        materials: (materials ?? []) as Material[],
        completed: progress?.completed ?? false,
        videoUrl,
      }
    },
    enabled: !!lessonId && !!profile,
  })

  async function toggleComplete() {
    if (!lessonId || !profile || !data) return
    setMarking(true)
    await supabase.from('lesson_progress').upsert(
      {
        student_id: profile.id,
        lesson_id: lessonId,
        completed: !data.completed,
        completed_at: !data.completed ? new Date().toISOString() : null,
      },
      { onConflict: 'student_id,lesson_id' },
    )
    await queryClient.invalidateQueries({ queryKey: ['lesson', lessonId, profile.id] })
    await queryClient.invalidateQueries({ queryKey: ['student-modules', profile.id] })
    setMarking(false)
  }

  async function openMaterial(material: Material) {
    const url = await getSignedUrl('materials', material.file_path)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  const { lesson, materials, completed, videoUrl } = data

  return (
    <div className="flex flex-col gap-4">
      <Link to="/aluno" className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Voltar às aulas
      </Link>

      <h1 className="text-xl font-semibold text-fg">{lesson.title}</h1>
      {lesson.description && <p className="text-sm text-fg-muted">{lesson.description}</p>}

      {videoUrl ? (
        <video controls className="w-full max-w-3xl rounded-lg border border-border bg-black" src={videoUrl} />
      ) : (
        <p className="text-sm text-fg-muted">Vídeo ainda não disponível.</p>
      )}

      <Button
        variant={completed ? 'outline' : 'default'}
        onClick={toggleComplete}
        disabled={marking}
        className="w-fit"
      >
        <CheckCircle2 className="size-4" />
        {completed ? 'Concluída — marcar como não vista' : 'Marcar como concluída'}
      </Button>

      {materials.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-fg">Materiais</h2>
          {materials.map((material) => (
            <button
              key={material.id}
              onClick={() => openMaterial(material)}
              className="flex w-fit items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg hover:bg-border/30"
            >
              <Download className="size-4" />
              {material.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
