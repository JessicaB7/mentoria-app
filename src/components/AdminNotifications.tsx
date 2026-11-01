import * as React from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
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

// Popups em tempo real para o admin: quando um aluno conclui uma aula,
// preenche o Check-in Mentoria ou envia uma dúvida para o Hot Seat. Só funciona enquanto a app está aberta
// (mesmo noutra aba) — não é uma notificação push verdadeira.
export function AdminNotifications() {
  const queryClient = useQueryClient()
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
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hot_seat_questions' },
        (payload) => {
          const row = payload.new as { student_name: string }
          notify('Nova dúvida para o Hot Seat 💬', `${row.student_name} enviou uma dúvida`)
          queryClient.invalidateQueries({ queryKey: ['admin-hot-seat-questions'] })
          queryClient.invalidateQueries({ queryKey: ['admin-attention-panel'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return null
}
