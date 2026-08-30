import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/spinner'
import type { UserRole } from '@/types/database'

export function ProtectedRoute({ role }: { role?: UserRole }) {
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

  // Admin pode sempre pré-visualizar a área de aluno; o inverso não é permitido.
  const allowed = !role || profile.role === role || (role === 'student' && profile.role === 'admin')

  if (!allowed) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/aluno'} replace />
  }

  return <Outlet />
}
