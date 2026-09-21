import * as React from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

function hasCheckIn(p: Profile) {
  return Boolean(
    p.current_services ||
      (p.challenges && p.challenges.length > 0) ||
      p.other_challenges ||
      p.enrollment_reason ||
      p.success_definition ||
      p.learning_goals ||
      p.additional_notes,
  )
}

function notify(title: string, body: string) {
  toast.success(title, { description: body })
  if (
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted' &&
    document.visibilityState !== 'visible'
  ) {
    new Notification(title, { body, icon: '/favicon.svg' })
  }
}

// Popups em tempo real para o admin: quando um aluno conclui uma aula ou
// preenche o Check-in Mentoria. Só funciona enquanto a app está aberta
// (mesmo noutra aba) — não é uma notificação push verdadeira.
export function AdminNotifications() {
  React.useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  React.useEffect(() => {
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lesson_progress', filter: 'completed=eq.true' },
        async (payload) => {
          const row = payload.new as { student_id: string; lesson_id: string }
          const [{ data: student }, { data: lesson }] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', row.student_id).single(),
            supabase.from('lessons').select('title').eq('id', row.lesson_id).single(),
          ])
          notify(
            'Aula concluída 🎉',
            `${student?.full_name ?? 'Um aluno'} concluiu "${lesson?.title ?? 'uma aula'}"`,
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const oldRow = payload.old as Profile
          const newRow = payload.new as Profile
          if (newRow.role !== 'student') return
          if (!hasCheckIn(oldRow) && hasCheckIn(newRow)) {
            notify('Check-in preenchido 📝', `${newRow.full_name} preencheu o Check-in Mentoria`)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return null
}
