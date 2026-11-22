// Преобразование имён полей: сервер отдаёт snake_case, интерфейс работает с camelCase.
// Только здесь, остальной код про snake_case не знает.

const toCamel = (key: string) => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

function mapKeys(value: unknown, fn: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map((item) => mapKeys(item, fn))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [fn(k), mapKeys(v, fn)]),
    )
  }
  return value
}

export const camelize = <T>(value: unknown): T => mapKeys(value, toCamel) as T
export const snakeize = (value: unknown): unknown => mapKeys(value, toSnake)
