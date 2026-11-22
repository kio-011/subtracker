import type { Subscription } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cycleLabel, daysUntilText, formatMoney, formatShortDate } from '@/lib/format'

interface Props {
  subscription: Subscription
  currency: string
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}

/** Строка списка: название, период и дата списания слева, суммы справа, действия ниже. */
export function SubscriptionRow({ subscription: sub, currency, onEdit, onToggle, onDelete }: Props) {
  const period = cycleLabel(sub.billingCycle, sub.customIntervalDays)
  const next =
    sub.isActive && sub.chargeDate !== null && sub.daysUntil !== null
      ? `${period} · списание ${formatShortDate(sub.chargeDate)}, ${daysUntilText(sub.daysUntil)}`
      : period
  return (
    <li className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 border-t border-secondary px-5 py-4 first:border-t-0">
      <div className="flex items-center gap-2.5 font-sans text-[17px] font-medium">
        {sub.name}
        {!sub.isActive && <Badge variant="outline">Приостановлена</Badge>}
      </div>
      <div className="text-right text-base tabular-nums">{formatMoney(sub.amount, currency)}</div>
      <div className="font-light text-muted-foreground">{next}</div>
      <div className="text-right font-light text-muted-foreground tabular-nums">
        {formatMoney(sub.monthlyCost, currency)} в месяц
      </div>
      <div className="col-span-2 mt-2 flex flex-wrap gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onEdit} aria-label={`Изменить ${sub.name}`}>
          Изменить
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-label={`${sub.isActive ? 'Приостановить' : 'Возобновить'} ${sub.name}`}
        >
          {sub.isActive ? 'Приостановить' : 'Возобновить'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDelete} aria-label={`Удалить ${sub.name}`}>
          Удалить
        </Button>
      </div>
    </li>
  )
}
