import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getPublicUrl } from '@/lib/storage'
import type { AppSetting } from '@/types/database'

const DEFAULT_MENTORIA_NAME = 'Contabilista Explica'

const DEFAULT_WELCOME_BODY =
  'Aqui encontrarás toda a informação relacionada à tua jornada dentro da mentoria.\nDeverás ir documentando por aqui todos os teus passos para que eu saiba em que ponto de situação estás e de que forma te poderei ajudar em cada uma das várias fases.'

const SETTINGS_KEYS = [
  'home_mentoria_name',
  'home_welcome_body',
  'home_mentor_note',
  'home_cover_path',
] as const

export function useHomeWelcomeSettings() {
  return useQuery({
    queryKey: ['home-welcome-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .in('key', SETTINGS_KEYS as unknown as string[])
      if (error) throw error
      const rows = (data ?? []) as AppSetting[]
      const byKey = new Map(rows.map((r) => [r.key, r]))
      const coverPath = byKey.get('home_cover_path')?.value || ''
      return {
        mentoriaName: byKey.get('home_mentoria_name')?.value || DEFAULT_MENTORIA_NAME,
        body: byKey.get('home_welcome_body')?.value || DEFAULT_WELCOME_BODY,
        mentorNote: byKey.get('home_mentor_note')?.value || '',
        mentorNoteUpdatedAt: byKey.get('home_mentor_note')?.updated_at || null,
        coverPath,
        coverUrl: coverPath ? getPublicUrl('module-covers', coverPath) : '',
      }
    },
  })
}
