import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '@/api/endpoints'
import { session } from '@/api/session'
import type { User } from '@/api/types'

interface AuthValue {
  user: User | null
  /** Идёт проверка сохранённой сессии при запуске. */
  booting: boolean
  /** Сессия закончилась сама (не удалось обновить токен). */
  expired: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [booting, setBooting] = useState(session.hasSession())
  const [expired, setExpired] = useState(false)

  useEffect(() => session.onExpired(() => {
    setUser(null)
    setExpired(true)
  }), [])

  useEffect(() => {
    if (!session.hasSession()) return
    const controller = new AbortController()
    authApi
      .me(controller.signal)
      .then(setUser)
      .catch(() => {
        if (!controller.signal.aborted) session.clear()
      })
      .finally(() => {
        if (!controller.signal.aborted) setBooting(false)
      })
    return () => controller.abort()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password)
    session.save(tokens.accessToken, tokens.refreshToken)
    setExpired(false)
    setUser(await authApi.me())
  }, [])

  const register = useCallback(
    async (email: string, password: string) => {
      await authApi.register(email, password)
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    session.clear()
    setUser(null)
    setExpired(false)
  }, [])

  const value = useMemo(
    () => ({ user, booting, expired, login, register, logout }),
    [user, booting, expired, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
