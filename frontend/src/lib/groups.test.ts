import { groupByCharge, groupOf } from './groups'

describe('groupOf', () => {
  it.each([
    [0, 'today'],
    [1, 'week'],
    [7, 'week'],
    [8, 'month'],
    [30, 'month'],
    [31, 'later'],
    [120, 'later'],
    [null, 'paused'],
  ] as const)('daysUntil %s -> %s', (days, expected) => {
    expect(groupOf(days)).toBe(expected)
  })
})

describe('groupByCharge', () => {
  it('orders groups, keeps item order and drops empty groups', () => {
    const items = [
      { id: 1, daysUntil: 120 },
      { id: 2, daysUntil: 2 },
      { id: 3, daysUntil: null },
      { id: 4, daysUntil: 6 },
    ]
    const groups = groupByCharge(items)
    expect(groups.map((g) => g.key)).toEqual(['week', 'later', 'paused'])
    expect(groups[0]?.items.map((i) => i.id)).toEqual([2, 4])
  })
})
