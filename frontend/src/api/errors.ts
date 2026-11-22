// Ошибка запроса к API: статус (0 для сетевого сбоя), текст и ошибки по полям (для 422).

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }

  get isNetwork() {
    return this.status === 0
  }
}

interface ValidationItem {
  loc?: (string | number)[]
  msg?: string
}

/** Достаёт из тела ответа текст ошибки и ошибки по полям (формат FastAPI). */
export function parseErrorBody(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return new ApiError(status, detail)
  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {}
    for (const item of detail as ValidationItem[]) {
      const field = item.loc?.[item.loc.length - 1]
      if (typeof field === 'string' && !(field in fieldErrors)) fieldErrors[field] = item.msg ?? ''
    }
    return new ApiError(status, 'Validation error', fieldErrors)
  }
  return new ApiError(status, 'Request failed')
}
