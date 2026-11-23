import { ArrowDownAZ, ArrowUpZA } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { subscriptionsApi } from '@/api/endpoints'
import type { BillingCycle, ListParams, Subscription } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { DeleteDialog } from '@/components/DeleteDialog'
import { SubscriptionDialog } from '@/components/SubscriptionDialog'
import { SubscriptionRow } from '@/components/SubscriptionRow'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/StateBlocks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAsync } from '@/hooks/useAsync'
import { CYCLE_OPTIONS } from '@/lib/format'

type StatusFilter = 'all' | 'active' | 'paused'
type SortField = NonNullable<ListParams['sort']>

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'id', label: 'По добавлению' },
  { value: 'name', label: 'По названию' },
  { value: 'amount', label: 'По сумме' },
  { value: 'monthly_cost', label: 'По стоимости в месяц' },
  { value: 'charge_date', label: 'По дате списания' },
]

function pluralSubscriptions(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} подписка`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} подписки`
  return `${n} подписок`
}

export default function Subscriptions() {
  const { user } = useAuth()
  const currency = user?.defaultCurrency ?? 'USD'

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [cycle, setCycle] = useState<BillingCycle | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortField>('id')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | undefined>()
  const [deleting, setDeleting] = useState<Subscription | null>(null)

  // Фокус после закрытия диалога возвращается на кнопку, которая его открыла (правило 6.4).
  const openerRef = useRef<HTMLElement | null>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const rememberOpener = () => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }
  const returnFocus = () => {
    const opener = openerRef.current
    ;(opener && opener.isConnected ? opener : addButtonRef.current)?.focus()
  }

  // Пауза 300 мс после последнего символа (правило 9.1).
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const list = useAsync(
    (signal) =>
      subscriptionsApi.list(
        {
          q: debounced,
          billingCycle: cycle === 'all' ? undefined : cycle,
          isActive: status === 'all' ? undefined : status === 'active',
          sort,
          order,
        },
        signal,
      ),
    [debounced, cycle, status, sort, order],
  )

  const filtersActive = debounced.trim() !== '' || cycle !== 'all' || status !== 'all'
  const items = list.data
  const firstLoad = items === undefined && list.loading

  function openAdd() {
    rememberOpener()
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(subscription: Subscription) {
    rememberOpener()
    setEditing(subscription)
    setDialogOpen(true)
  }

  async function toggle(subscription: Subscription) {
    try {
      await subscriptionsApi.update(subscription.id, { isActive: !subscription.isActive })
      list.reload()
    } catch {
      toast.error('Не удалось изменить статус. Повторите попытку')
    }
  }

  function resetFilters() {
    setSearch('')
    setDebounced('')
    setCycle('all')
    setStatus('all')
  }

  let subtitle = 'Загружаем подписки…'
  if (list.error) subtitle = 'Не удалось получить данные'
  else if (items) subtitle = items.length === 0 ? (filtersActive ? 'Ничего не найдено' : 'Пока ничего нет') : pluralSubscriptions(items.length)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl">Мои подписки</h1>
          <p className="mt-1 font-light text-muted-foreground" role="status">
            {subtitle}
          </p>
        </div>
        <Button type="button" ref={addButtonRef} onClick={openAdd}>
          Добавить подписку
        </Button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <Input
          type="search"
          aria-label="Поиск по названию"
          placeholder="Поиск по названию"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select value={cycle} onValueChange={(value) => setCycle(value as BillingCycle | 'all')}>
          <SelectTrigger aria-label="Период оплаты" className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любой период</SelectItem>
            {CYCLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
          <SelectTrigger aria-label="Статус" className="w-full sm:w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="paused">Приостановленные</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => setSort(value as SortField)}>
          <SelectTrigger aria-label="Сортировка" className="w-full sm:w-[230px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full sm:w-12 sm:px-0"
          aria-label={order === 'asc' ? 'Порядок: по возрастанию' : 'Порядок: по убыванию'}
          onClick={() => setOrder((value) => (value === 'asc' ? 'desc' : 'asc'))}
        >
          {order === 'asc' ? <ArrowDownAZ aria-hidden="true" /> : <ArrowUpZA aria-hidden="true" />}
        </Button>
      </div>

      {firstLoad && <LoadingBlock label="Загружаем подписки…" />}
      {list.error !== undefined && <ErrorBlock message="Не удалось загрузить подписки" onRetry={list.reload} />}
      {!list.error && items && items.length === 0 && filtersActive && (
        <EmptyBlock
          title="Ничего не найдено"
          text="Измените запрос или сбросьте фильтры."
          action={
            <Button type="button" variant="secondary" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          }
        />
      )}
      {!list.error && items && items.length === 0 && !filtersActive && (
        <EmptyBlock
          title="Подписок пока нет"
          text="Добавьте первую подписку, и она появится здесь с суммой и датой следующего списания."
          action={
            <Button type="button" onClick={openAdd}>
              Добавить подписку
            </Button>
          }
        />
      )}
      {!list.error && items && items.length > 0 && (
        <ul
          aria-busy={list.loading}
          aria-label="Список подписок"
          className={`overflow-hidden rounded-[var(--radius-card)] border bg-card transition-opacity ${list.loading ? 'opacity-60' : ''}`}
        >
          {items.map((subscription) => (
            <SubscriptionRow
              key={subscription.id}
              subscription={subscription}
              currency={currency}
              onEdit={() => openEdit(subscription)}
              onToggle={() => void toggle(subscription)}
              onDelete={() => {
                rememberOpener()
                setDeleting(subscription)
              }}
            />
          ))}
        </ul>
      )}

      <SubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subscription={editing}
        onSaved={list.reload}
        returnFocus={returnFocus}
      />
      <DeleteDialog
        subscription={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={list.reload}
        returnFocus={returnFocus}
      />
    </div>
  )
}
