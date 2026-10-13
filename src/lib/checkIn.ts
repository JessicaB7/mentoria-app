import type { Profile } from '@/types/database'

export function checkInFilledCount(student: Profile) {
  return [
    student.current_services,
    student.challenges && student.challenges.length > 0 ? 'x' : null,
    student.other_challenges,
    student.enrollment_reason,
    student.success_definition,
    student.learning_goals,
    student.additional_notes,
  ].filter(Boolean).length
}

export const CHECK_IN_FIELDS = 7
