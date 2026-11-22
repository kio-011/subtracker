// Dates are ISO calendar days ("2026-10-16"). Parse them as local dates on purpose:
// new Date("2026-10-16") would be UTC midnight and can show the previous day.
export function parseDay(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDay(iso: string, locale: string, withYear = false): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(parseDay(iso))
}

export function formatShortDay(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
    .format(parseDay(iso))
    .replace('.', '')
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
