export type GroupKey = 'today' | 'week' | 'month' | 'later' | 'paused'

export const GROUP_ORDER: GroupKey[] = ['today', 'week', 'month', 'later', 'paused']

export function groupOf(daysUntil: number | null): GroupKey {
  if (daysUntil === null) return 'paused'
  if (daysUntil <= 0) return 'today'
  if (daysUntil <= 7) return 'week'
  if (daysUntil <= 30) return 'month'
  return 'later'
}

export interface Group<T> {
  key: GroupKey
  items: T[]
}

// Keeps the order of `items` inside each group and drops empty groups.
export function groupByCharge<T extends { daysUntil: number | null }>(items: T[]): Group<T>[] {
  const buckets = new Map<GroupKey, T[]>()
  for (const item of items) {
    const key = groupOf(item.daysUntil)
    const list = buckets.get(key)
    if (list) list.push(item)
    else buckets.set(key, [item])
  }
  return GROUP_ORDER.filter((key) => buckets.has(key)).map((key) => ({
    key,
    items: buckets.get(key) ?? [],
  }))
}
