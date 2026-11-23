import type { BillingCycle } from '@/api/types'

/** Сумма из строки API в формате ru-RU с валютой пользователя: «15,49 $». */
export function formatMoney(value: string, currency: string): string {
  const amount = Number(value)
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2).replace('.', ',')} ${currency}`
  }
}

/** Дата YYYY-MM-DD как «25 нояб.» (без сдвига часового пояса). */
export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/** «через 2 дня», «сегодня». */
export function daysUntilText(days: number): string {
  if (days === 0) return 'сегодня'
  return `через ${days} ${plural(days, 'день', 'дня', 'дней')}`
}

export function cycleLabel(cycle: BillingCycle, intervalDays: number | null = null): string {
  switch (cycle) {
    case 'monthly':
      return 'каждый месяц'
    case 'yearly':
      return 'каждый год'
    case 'weekly':
      return 'каждую неделю'
    case 'custom_days':
      return intervalDays
        ? `каждые ${intervalDays} ${plural(intervalDays, 'день', 'дня', 'дней')}`
        : 'свой интервал в днях'
  }
}

export const CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Каждый месяц' },
  { value: 'yearly', label: 'Каждый год' },
  { value: 'weekly', label: 'Каждую неделю' },
  { value: 'custom_days', label: 'Свой интервал в днях' },
]
