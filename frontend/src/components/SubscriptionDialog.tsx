import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ApiError } from '@/api/errors'
import { subscriptionsApi } from '@/api/endpoints'
import type { Subscription, SubscriptionPatch } from '@/api/types'
import { SubmitButton } from '@/components/SubmitButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CYCLE_OPTIONS } from '@/lib/format'

const MIN_DATE = '2000-01-01'
const MAX_DATE = '2100-12-31'

const schema = z
  .object({
    name: z.string().trim().min(1, 'Введите название').max(255, 'Не больше 255 символов'),
    amount: z.string(),
    billingCycle: z.enum(['monthly', 'yearly', 'weekly', 'custom_days']),
    customIntervalDays: z.string(),
    startDate: z.string(),
    note: z.string().max(500, 'Не больше 500 символов'),
  })
  .superRefine((values, ctx) => {
    const amount = values.amount.trim().replace(',', '.')
    if (!/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0) {
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Сумма должна быть больше 0' })
    } else if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Не больше двух знаков после запятой' })
    } else if (amount.replace('.', '').length > 10) {
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Слишком большая сумма' })
    }
    if (values.billingCycle === 'custom_days') {
      const days = Number(values.customIntervalDays)
      if (!/^\d+$/.test(values.customIntervalDays.trim()) || days < 1 || days > 3650) {
        ctx.addIssue({ code: 'custom', path: ['customIntervalDays'], message: 'Введите число дней от 1 до 3650' })
      }
    }
    if (!values.startDate) {
      ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'Укажите дату начала' })
    } else if (values.startDate < MIN_DATE || values.startDate > MAX_DATE) {
      ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'Дата должна быть между 2000 и 2100 годом' })
    }
  })
type Values = z.infer<typeof schema>

const SERVER_FIELDS: Record<string, keyof Values> = {
  name: 'name',
  amount: 'amount',
  billing_cycle: 'billingCycle',
  custom_interval_days: 'customIntervalDays',
  start_date: 'startDate',
  note: 'note',
}

function toValues(subscription?: Subscription): Values {
  return {
    name: subscription?.name ?? '',
    amount: subscription?.amount ?? '',
    billingCycle: subscription?.billingCycle ?? 'monthly',
    customIntervalDays: subscription?.customIntervalDays ? String(subscription.customIntervalDays) : '',
    startDate: subscription?.startDate ?? '',
    note: subscription?.note ?? '',
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Если передана, диалог редактирует эту подписку (PATCH), иначе создаёт новую. */
  subscription?: Subscription
  onSaved: () => void
  /** Куда вернуть фокус после закрытия (правило 6.4). */
  returnFocus?: () => void
}

/** Диалог добавления и изменения подписки (правила 5.x и 9.5). */
export function SubscriptionDialog({ open, onOpenChange, subscription, onSaved, returnFocus }: Props) {
  const editing = subscription !== undefined
  const [formError, setFormError] = useState(false)
  const submitting = useRef(false) // защита от двойной отправки (правило 5.3)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(subscription),
    shouldFocusError: true,
  })
  const pending = form.formState.isSubmitting
  const cycle = form.watch('billingCycle')

  useEffect(() => {
    if (open) {
      form.reset(toValues(subscription))
      setFormError(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subscription])

  async function onSubmit(values: Values) {
    if (submitting.current) return
    submitting.current = true
    setFormError(false)
    const payload = {
      name: values.name.trim(),
      amount: values.amount.trim().replace(',', '.'),
      billingCycle: values.billingCycle,
      customIntervalDays: values.billingCycle === 'custom_days' ? Number(values.customIntervalDays) : null,
      startDate: values.startDate,
      note: values.note.trim() || null,
    }
    try {
      if (subscription) {
        const patch: SubscriptionPatch = {}
        if (payload.name !== subscription.name) patch.name = payload.name
        if (Number(payload.amount) !== Number(subscription.amount)) patch.amount = payload.amount
        if (payload.billingCycle !== subscription.billingCycle) patch.billingCycle = payload.billingCycle
        if (payload.customIntervalDays !== subscription.customIntervalDays) {
          patch.customIntervalDays = payload.customIntervalDays
        }
        if (payload.startDate !== subscription.startDate) patch.startDate = payload.startDate
        if (payload.note !== (subscription.note ?? null)) patch.note = payload.note
        if (Object.keys(patch).length > 0) await subscriptionsApi.update(subscription.id, patch)
        toast.success(Object.keys(patch).length > 0 ? 'Изменения сохранены' : 'Изменений нет')
      } else {
        await subscriptionsApi.create(payload)
        toast.success('Подписка добавлена')
      }
      onOpenChange(false)
      onSaved()
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        let first = true
        for (const [serverField, message] of Object.entries(error.fieldErrors)) {
          const field = SERVER_FIELDS[serverField]
          if (field) {
            form.setError(field, { message: message || 'Проверьте значение' }, { shouldFocus: first })
            first = false
          }
        }
        if (first) setFormError(true)
      } else {
        setFormError(true)
      }
    } finally {
      submitting.current = false
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent
        className="max-h-dvh overflow-y-auto sm:max-w-[480px]"
        aria-busy={pending}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocus?.()
        }}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="font-sans text-xl font-medium">
            {editing ? 'Изменить подписку' : 'Добавить подписку'}
          </DialogTitle>
          <DialogDescription className="font-light">Укажите, за что и как часто вы платите.</DialogDescription>
        </DialogHeader>

        {formError && (
          <Alert variant="destructive">
            <AlertDescription>Не удалось сохранить. Повторите попытку. Введённые данные не потеряны.</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Например, Netflix" autoComplete="off" disabled={pending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сумма</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="0,00" autoComplete="off" disabled={pending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Период оплаты</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={pending}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CYCLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {cycle === 'custom_days' && (
              <FormField
                control={form.control}
                name="customIntervalDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Интервал в днях</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="90" autoComplete="off" disabled={pending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата начала</FormLabel>
                  <FormControl>
                    <Input type="date" min={MIN_DATE} max={MAX_DATE} disabled={pending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметка (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="До 500 символов" disabled={pending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-2 gap-2 sm:justify-end">
              <Button type="button" variant="secondary" disabled={pending} onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <SubmitButton pending={pending} pendingText="Сохраняем…">
                {editing ? 'Сохранить' : 'Добавить'}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
