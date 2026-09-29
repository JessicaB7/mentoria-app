import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/spinner'
import { SetPasswordPage } from '@/routes/auth/SetPasswordPage'
import { isStaff, type UserRole } from '@/types/database'

export function ProtectedRoute({ role }: { role?: Extract<UserRole, 'student'> | 'staff' }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />
  }

  // Staff (admin/mentor) can always preview the student area; the reverse is not allowed.
  const allowed =
    !role ||
    (role === 'staff' && isStaff(profile.role)) ||
    (role === 'student' && (profile.role === 'student' || isStaff(profile.role)))

  if (!allowed) {
    return <Navigate to={isStaff(profile.role) ? '/admin' : '/aluno'} replace />
  }

  // Alunos definem a própria password no primeiro acesso (a conta é criada com uma password gerada)
  if (profile.role === 'student' && !session.user.user_metadata?.password_set) {
    return <SetPasswordPage />
  }

  return <Outlet />
}
