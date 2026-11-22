import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3 py-1.5 font-sans text-base font-medium no-underline transition-colors',
    isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
  )

/** Верхняя панель с навигацией и выходом, под ней страница. */
export function AppLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="mx-auto min-h-dvh max-w-[1280px] px-3 pb-12 sm:px-8">
      <header className="mt-3 flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--radius-frame)] border bg-black/60 px-5 py-2 sm:mt-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Logo />
          <nav aria-label="Разделы" className="flex items-center gap-1">
            <NavLink to="/subscriptions" className={navClass}>
              Подписки
            </NavLink>
            <NavLink to="/overview" className={navClass}>
              Обзор
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-light text-muted-foreground sm:inline">{user?.email}</span>
          <Button variant="secondary" size="sm" onClick={logout}>
            Выйти
          </Button>
        </div>
      </header>
      <main className="pt-8">
        <Outlet />
      </main>
    </div>
  )
}
