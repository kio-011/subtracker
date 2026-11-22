import { camelize, snakeize } from './case'
import { ApiError, parseErrorBody } from './errors'
import { session } from './session'

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  /** false для входа и регистрации: токен не нужен и при 401 обновлять нечего. */
  auth?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(path, API_URL)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function send(path: string, options: RequestOptions, token: string | null) {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(snakeize(options.body)) : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Network error')
  }
}

let refreshing: Promise<boolean> | null = null

/** Один запрос на обновление токена, даже если 401 пришёл сразу на несколько запросов. */
function refreshAccessToken(): Promise<boolean> {
  refreshing ??= (async () => {
    const refresh = session.getRefreshToken()
    if (!refresh) return false
    try {
      const response = await send('/api/auth/refresh', { method: 'POST', body: { refreshToken: refresh } }, null)
      if (!response.ok) return false
      const data = (await response.json()) as { access_token: string }
      session.save(data.access_token)
      return true
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const authed = options.auth !== false
  let response = await send(path, options, authed ? session.getAccessToken() : null)

  if (response.status === 401 && authed) {
    if (await refreshAccessToken()) {
      response = await send(path, options, session.getAccessToken())
    }
    if (response.status === 401) {
      session.expire()
      throw parseErrorBody(401, await response.json().catch(() => null))
    }
  }

  if (!response.ok) throw parseErrorBody(response.status, await response.json().catch(() => null))
  if (response.status === 204) return undefined as T
  return camelize<T>(await response.json())
}
