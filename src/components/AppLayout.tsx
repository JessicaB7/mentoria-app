import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { GraduationCap, LayoutDashboard, Users, KanbanSquare, BookOpen, LogOut, Euro } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const studentNav = [{ to: '/aluno', label: 'Aulas', icon: BookOpen, end: true }]

const adminNav = [
  { to: '/admin', label: 'Aulas', icon: LayoutDashboard, end: true },
  { to: '/admin/alunos', label: 'Alunos', icon: Users, end: false },
  { to: '/admin/crm', label: 'CRM', icon: KanbanSquare, end: false },
  { to: '/admin/financeiro', label: 'Financeiro', icon: Euro, end: false },
]

export function AppLayout({ variant }: { variant: 'admin' | 'student' }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const nav = variant === 'admin' ? adminNav : studentNav
  const initials = profile?.full_name?.slice(0, 2).toUpperCase() ?? '??'
  const canPreview = profile?.role === 'admin'

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <GraduationCap className="size-6 shrink-0 text-primary" />
          <span className="text-sm font-semibold leading-tight text-fg">Mentoria Contabilistas</span>
        </div>

        {canPreview && (
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="text-xs font-medium text-fg-muted">
              Vista {variant === 'admin' ? 'Mentor' : 'Aluno'}
            </span>
            <Switch
              checked={variant === 'student'}
              onCheckedChange={(checked) => navigate(checked ? '/aluno' : '/admin')}
            />
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-border/40',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 border-t border-border p-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{profile?.full_name}</p>
            <p className="truncate text-xs text-fg-muted">
              {profile?.role === 'admin' ? 'Administrador' : 'Aluno'}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-md p-2 text-fg-muted hover:bg-border/40 hover:text-fg"
            title="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
