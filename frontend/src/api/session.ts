// Единственное место, которое хранит токены. Остальной код их не трогает.

const ACCESS = 'subtracker.access'
const REFRESH = 'subtracker.refresh'

type Listener = () => void
const expiredListeners = new Set<Listener>()

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* хранилище недоступно: сессия живёт до перезагрузки */
  }
}

export const session = {
  getAccessToken: () => read(ACCESS),
  getRefreshToken: () => read(REFRESH),
  hasSession: () => read(ACCESS) !== null,
  save(access: string, refresh?: string) {
    write(ACCESS, access)
    if (refresh !== undefined) write(REFRESH, refresh)
  },
  clear() {
    write(ACCESS, null)
    write(REFRESH, null)
  },
  /** Сессия закончилась (не удалось обновить токен): интерфейс уводит на вход. */
  expire() {
    session.clear()
    expiredListeners.forEach((fn) => fn())
  },
  onExpired(fn: Listener) {
    expiredListeners.add(fn)
    return () => {
      expiredListeners.delete(fn)
    }
  },
}
