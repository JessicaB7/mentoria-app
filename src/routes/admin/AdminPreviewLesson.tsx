import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, ExternalLink, CheckCircle2, Circle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSignedUrl } from '@/lib/storage'
import { renderRichText } from '@/lib/richText'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import type { Lesson, Material, SessionRecording } from '@/types/database'

export function AdminPreviewLesson() {
  const { studentId, lessonId } = useParams<{ studentId: string; lessonId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-preview-lesson', lessonId, studentId],
    queryFn: async () => {
      const [
        { data: lesson, error: lessonError },
        { data: materials, error: materialsError },
        { data: recordings },
        { data: progress },
      ] = await Promise.all([
        supabase.from('lessons').select('*').eq('id', lessonId!).single(),
        supabase.from('materials').select('*').eq('lesson_id', lessonId!),
        supabase
          .from('session_recordings')
          .select('*')
          .eq('lesson_id', lessonId!)
          .order('position', { ascending: true }),
        supabase
          .from('lesson_progress')
          .select('*')
          .eq('lesson_id', lessonId!)
          .eq('student_id', studentId!)
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
        recordings: (recordings ?? []) as SessionRecording[],
        completed: progress?.completed ?? false,
        videoUrl,
      }
    },
    enabled: !!lessonId && !!studentId,
  })

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

  const { lesson, materials, recordings, completed, videoUrl } = data

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/admin/individual/${studentId}/preview`}
        className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Voltar às aulas
      </Link>

      <div className="flex items-center gap-2">
        <Badge variant="outline">Pré-visualização</Badge>
        {completed ? (
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="size-3.5" /> Concluída pelo aluno
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-fg-muted">
            <Circle className="size-3.5" /> Ainda não concluída
          </span>
        )}
      </div>

      <h1 className="text-xl font-semibold text-fg">{lesson.title}</h1>
      {lesson.session_date && (
        <p className="text-sm text-fg-muted">
          {new Date(lesson.session_date + 'T00:00:00').toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
      {lesson.description && (
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-fg">
          {renderRichText(lesson.description)}
        </div>
      )}

      {videoUrl ? (
        <video controls className="w-full max-w-3xl rounded-lg border border-border bg-black" src={videoUrl} />
      ) : (
        <p className="text-sm text-fg-muted">Vídeo ainda não disponível.</p>
      )}

      {recordings.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-fg">Gravações das sessões</h2>
          {recordings.map((recording) => (
            <a
              key={recording.id}
              href={recording.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg hover:bg-border/30"
            >
              <ExternalLink className="size-4" />
              {recording.title}
            </a>
          ))}
        </div>
      )}

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
