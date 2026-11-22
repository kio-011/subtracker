import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from './AuthContext'

function Booting() {
  return (
    <div className="p-8" aria-busy="true">
      <Skeleton className="h-16 w-full" />
    </div>
  )
}

/** Защищённые страницы: без входа уводим на /login с пояснением (правила 1.2 и 1.4). */
export function RequireAuth() {
  const { user, booting, expired } = useAuth()
  const location = useLocation()
  if (booting) return <Booting />
  if (!user) {
    const reason = expired ? 'expired' : 'required'
    return <Navigate to="/login" replace state={{ reason, from: location.pathname }} />
  }
  return <Outlet />
}

/** Вход и регистрация: уже вошедшего уводим в приложение (правило 1.3). */
export function PublicOnly() {
  const { user, booting } = useAuth()
  if (booting) return <Booting />
  if (user) return <Navigate to="/subscriptions" replace />
  return <Outlet />
}
