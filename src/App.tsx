import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'
import { LoginPage } from '@/routes/auth/LoginPage'
import { ResetPasswordPage } from '@/routes/auth/ResetPasswordPage'
import { StudentDashboard } from '@/routes/student/StudentDashboard'
import { StudentModulePage } from '@/routes/student/StudentModulePage'
import { LessonPage } from '@/routes/student/LessonPage'
import { AdminLessons } from '@/routes/admin/AdminLessons'
import { AdminModulePage } from '@/routes/admin/AdminModulePage'
import { AdminStudents } from '@/routes/admin/AdminStudents'
import { AdminCrm } from '@/routes/admin/AdminCrm'
import { AdminFinance } from '@/routes/admin/AdminFinance'
import { Spinner } from '@/components/ui/spinner'

const queryClient = new QueryClient()

function RootRedirect() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!session || !profile) return <Navigate to="/login" replace />
  return <Navigate to={profile.role === 'admin' ? '/admin' : '/aluno'} replace />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster richColors position="top-right" />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute role="student" />}>
              <Route element={<AppLayout variant="student" />}>
                <Route path="/aluno" element={<StudentDashboard />} />
                <Route path="/aluno/modulos/:moduleId" element={<StudentModulePage />} />
                <Route path="/aluno/aulas/:lessonId" element={<LessonPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute role="admin" />}>
              <Route element={<AppLayout variant="admin" />}>
                <Route path="/admin" element={<AdminLessons />} />
                <Route path="/admin/modulos/:moduleId" element={<AdminModulePage />} />
                <Route path="/admin/alunos" element={<AdminStudents />} />
                <Route path="/admin/crm" element={<AdminCrm />} />
                <Route path="/admin/financeiro" element={<AdminFinance />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
