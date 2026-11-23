import { describe, expect, it } from 'vitest'
import { cycleLabel, daysUntilText, formatMoney, formatShortDate } from './format'

describe('форматирование (spec 4.3, fixtures.md)', () => {
  it('сумма в формате ru-RU с валютой пользователя', () => {
    expect(formatMoney('15.49', 'USD').replace(/\s/g, ' ')).toBe('15,49 $')
    expect(formatMoney('10000.00', 'USD').replace(/\s/g, ' ')).toBe('10 000,00 $')
  })

  it('дата без сдвига часового пояса', () => {
    expect(formatShortDate('2026-11-25')).toBe('25 нояб.')
    expect(formatShortDate('2027-03-23')).toBe('23 мар.')
  })

  it('склонение дней', () => {
    expect(daysUntilText(0)).toBe('сегодня')
    expect(daysUntilText(1)).toBe('через 1 день')
    expect(daysUntilText(2)).toBe('через 2 дня')
    expect(daysUntilText(9)).toBe('через 9 дней')
    expect(daysUntilText(11)).toBe('через 11 дней')
    expect(daysUntilText(21)).toBe('через 21 день')
    expect(daysUntilText(120)).toBe('через 120 дней')
  })

  it('период оплаты по-русски', () => {
    expect(cycleLabel('monthly')).toBe('каждый месяц')
    expect(cycleLabel('yearly')).toBe('каждый год')
    expect(cycleLabel('weekly')).toBe('каждую неделю')
    expect(cycleLabel('custom_days', 90)).toBe('каждые 90 дней')
  })
})
