import { formatMoney, isValidAmount, normalizeAmount, shareOfMax } from './money'

describe('formatMoney', () => {
  it('formats a decimal string with two places and the symbol', () => {
    expect(formatMoney('15.49', 'USD')).toBe('$15.49')
    expect(formatMoney('82.10', 'USD')).toBe('$82.10')
    expect(formatMoney('26.00', 'USD')).toBe('$26.00')
  })

  it('does not lose precision of long decimal strings', () => {
    expect(formatMoney('99999999.99', 'USD')).toBe('$99,999,999.99')
  })

  it('falls back to plain text for an unknown currency code', () => {
    expect(formatMoney('1.00', '??')).toBe('1.00 ??')
  })
})

describe('shareOfMax', () => {
  it('scales to the largest value', () => {
    expect(shareOfMax('26.00', '26.00')).toBe(100)
    expect(shareOfMax('13.00', '26.00')).toBe(50)
  })
  it('is 0 for a zero maximum', () => {
    expect(shareOfMax('0.00', '0.00')).toBe(0)
  })
})

describe('amount input', () => {
  it('accepts positive amounts with up to two decimals', () => {
    expect(isValidAmount('299')).toBe(true)
    expect(isValidAmount('299.5')).toBe(true)
    expect(isValidAmount('299,50')).toBe(true)
  })
  it('rejects zero, negatives, three decimals and text', () => {
    expect(isValidAmount('0')).toBe(false)
    expect(isValidAmount('-5')).toBe(false)
    expect(isValidAmount('1.234')).toBe(false)
    expect(isValidAmount('abc')).toBe(false)
    expect(isValidAmount('')).toBe(false)
  })
  it('normalizes to two decimals with a dot', () => {
    expect(normalizeAmount('299')).toBe('299.00')
    expect(normalizeAmount('299,5')).toBe('299.50')
  })
})
