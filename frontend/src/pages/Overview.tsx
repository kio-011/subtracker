import { Link } from 'react-router-dom'
import { statsApi, subscriptionsApi } from '@/api/endpoints'
import { useAuth } from '@/auth/AuthContext'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/StateBlocks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsync } from '@/hooks/useAsync'
import { cycleLabel, daysUntilText, formatMoney, formatShortDate } from '@/lib/format'

/** Полоса доли: только дополнение к числу, для скринридеров скрыта. */
function ShareBar({ percent }: { percent: string }) {
  return (
    <div aria-hidden="true" className="mt-1.5 h-1.5 w-full rounded-full bg-secondary">
      <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.min(Number(percent), 100)}%` }} />
    </div>
  )
}

export default function Overview() {
  const { user } = useAuth()
  const currency = user?.defaultCurrency ?? 'USD'
  const summary = useAsync((signal) => statsApi.summary(signal), [])
  const upcoming = useAsync((signal) => subscriptionsApi.upcoming(7, signal), [])
  const breakdown = useAsync((signal) => statsApi.breakdown(signal), [])

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl sm:text-3xl">Обзор</h1>

      <section aria-labelledby="totals-title" className="flex flex-col gap-3">
        <h2 id="totals-title" className="sr-only">
          Итоги
        </h2>
        {summary.loading && !summary.data && <LoadingBlock rows={1} label="Загружаем итоги…" />}
        {summary.error !== undefined && <ErrorBlock message="Не удалось загрузить итоги" onRetry={summary.reload} />}
        {summary.data && !summary.error && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="gap-1 px-6">
              <CardHeader className="p-0">
                <CardTitle className="font-light text-muted-foreground">В месяц</CardTitle>
              </CardHeader>
              <CardContent className="p-0 font-sans text-3xl font-medium tabular-nums">
                {formatMoney(summary.data.monthlyTotal, summary.data.currency)}
              </CardContent>
            </Card>
            <Card className="gap-1 px-6">
              <CardHeader className="p-0">
                <CardTitle className="font-light text-muted-foreground">В год</CardTitle>
              </CardHeader>
              <CardContent className="p-0 font-sans text-3xl font-medium tabular-nums">
                {formatMoney(summary.data.yearlyTotal, summary.data.currency)}
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <section aria-labelledby="upcoming-title" className="flex flex-col gap-3">
        <h2 id="upcoming-title" className="text-xl">
          Ближайшие списания
        </h2>
        {upcoming.loading && !upcoming.data && <LoadingBlock rows={2} label="Загружаем списания…" />}
        {upcoming.error !== undefined && (
          <ErrorBlock message="Не удалось загрузить ближайшие списания" onRetry={upcoming.reload} />
        )}
        {upcoming.data && !upcoming.error && upcoming.data.length === 0 && (
          <p className="rounded-[var(--radius-card)] border bg-card px-5 py-4 font-light text-muted-foreground">
            В ближайшие 7 дней списаний нет
          </p>
        )}
        {upcoming.data && !upcoming.error && upcoming.data.length > 0 && (
          <ul className="overflow-hidden rounded-[var(--radius-card)] border bg-card">
            {upcoming.data.map((charge) => (
              <li
                key={charge.id}
                className="grid grid-cols-[1fr_auto] gap-x-4 border-t border-secondary px-5 py-4 first:border-t-0"
              >
                <span className="font-sans text-[17px] font-medium">{charge.name}</span>
                <span className="text-right tabular-nums">{formatMoney(charge.amount, currency)}</span>
                <span className="font-light text-muted-foreground">
                  списание {formatShortDate(charge.chargeDate)}, {daysUntilText(charge.daysUntil)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="share-title" className="flex flex-col gap-3">
        <h2 id="share-title" className="text-xl">
          Доли расходов
        </h2>
        {breakdown.loading && !breakdown.data && <LoadingBlock rows={3} label="Загружаем доли…" />}
        {breakdown.error !== undefined && <ErrorBlock message="Не удалось загрузить доли" onRetry={breakdown.reload} />}
        {breakdown.data && !breakdown.error && breakdown.data.bySubscription.length === 0 && (
          <EmptyBlock
            title="Активных подписок пока нет"
            text="Добавьте подписку, и здесь появятся доли расходов."
            action={<Link to="/subscriptions">Добавить подписку</Link>}
          />
        )}
        {breakdown.data && !breakdown.error && breakdown.data.bySubscription.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-3 px-6">
              <CardHeader className="p-0">
                <CardTitle className="text-xl">По подпискам</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="flex flex-col gap-4">
                  {breakdown.data.bySubscription.map((share) => (
                    <li key={share.id}>
                      <div className="flex justify-between gap-3">
                        <span>{share.name}</span>
                        <span className="tabular-nums">
                          {formatMoney(share.monthlyCost, breakdown.data!.currency)} · {share.sharePercent.replace('.', ',')}%
                        </span>
                      </div>
                      <ShareBar percent={share.sharePercent} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="gap-3 px-6">
              <CardHeader className="p-0">
                <CardTitle className="text-xl">По периодам оплаты</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="flex flex-col gap-4">
                  {breakdown.data.byCycle.map((share) => (
                    <li key={share.billingCycle}>
                      <div className="flex justify-between gap-3">
                        <span>
                          {cycleLabel(share.billingCycle)} ({share.subscriptionCount})
                        </span>
                        <span className="tabular-nums">
                          {formatMoney(share.monthlyCost, breakdown.data!.currency)} · {share.sharePercent.replace('.', ',')}%
                        </span>
                      </div>
                      <ShareBar percent={share.sharePercent} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  )
}
