import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { AuthProvider } from '@/auth/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import { session } from '@/api/session'

interface Options {
  route?: string
  /** Войти заранее: токен уже сохранён, как после входа. */
  signedIn?: boolean
}

/** Рендерит всё приложение с маршрутизацией и подменённым сервером (MSW). */
export function renderApp({ route = '/login', signedIn = false }: Options = {}) {
  if (signedIn) session.save('access-1', 'refresh-1')
  const user = userEvent.setup()
  const utils = render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </MemoryRouter>,
  )
  return { user, ...utils }
}

/** Запросы, увиденные подменённым сервером: для проверки «ушёл ровно один». */
export function trackRequests(server: import('msw/node').SetupServer) {
  const seen: { method: string; url: string }[] = []
  server.events.on('request:start', ({ request }) => {
    seen.push({ method: request.method, url: request.url })
  })
  return seen
}
