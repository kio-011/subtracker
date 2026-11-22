// Money arrives from the backend as decimal strings ("15.49"). It is only formatted here,
// never summed or converted, so there is no floating-point rounding of amounts.
export function formatMoney(value: string, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
      value as `${number}`,
    )
  } catch {
    return `${value} ${currency}`
  }
}

// Bar width in percent, geometry only (not money): value / max, clamped to 0..100.
export function shareOfMax(value: string, max: string): number {
  const v = Number(value)
  const m = Number(max)
  if (!Number.isFinite(v) || !Number.isFinite(m) || m <= 0) return 0
  return Math.min(100, Math.max(0, (v / m) * 100))
}

const MONEY_RE = /^\d{1,8}(\.\d{1,2})?$/

// Amount typed by the user: positive, at most 2 decimals, up to 99 999 999.99 (as in the API).
export function isValidAmount(value: string): boolean {
  const text = value.trim().replace(',', '.')
  return MONEY_RE.test(text) && Number(text) > 0
}

export function normalizeAmount(value: string): string {
  const text = value.trim().replace(',', '.')
  const [whole = '0', frac = ''] = text.split('.')
  return `${whole}.${frac.padEnd(2, '0')}`
}

// --- Monthly equivalent, in integer cents ---------------------------------
// Amounts stay strings everywhere else; here they become integer cents so the
// selected total can be summed without any floating-point arithmetic.

export function toCents(value: string): number {
  const [whole, fraction = ''] = value.trim().split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2))
}

export function fromCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const absolute = Math.abs(cents)
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`
}

// Mirrors the backend rule: monthly as is, yearly / 12, weekly * 52 / 12,
// custom * 30 / N, rounded half up to the cent.
export function monthlyCents(
  amount: string,
  cycle: string,
  customIntervalDays: number | null,
): number {
  const cents = toCents(amount)
  if (cycle === 'monthly') return cents
  if (cycle === 'yearly') return Math.round(cents / 12)
  if (cycle === 'weekly') return Math.round((cents * 52) / 12)
  if (cycle === 'custom_days' && customIntervalDays) {
    return Math.round((cents * 30) / customIntervalDays)
  }
  return cents
}
