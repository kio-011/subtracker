import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicOnly, RequireAuth } from '@/auth/guards'
import { AppLayout } from '@/components/AppLayout'
import Login from '@/pages/Login'
import Overview from '@/pages/Overview'
import Register from '@/pages/Register'
import Subscriptions from '@/pages/Subscriptions'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/overview" element={<Overview />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/subscriptions" replace />} />
    </Routes>
  )
}
