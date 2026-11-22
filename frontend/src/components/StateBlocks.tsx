import type { ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/** Заглушка загрузки: скелетоны и aria-busy (правила 4.1, 10.4). */
export function LoadingBlock({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-[72px] w-full" />
      ))}
    </div>
  )
}

/** Ошибка загрузки с кнопкой «Повторить» (правила 4.4, 10.4). */
export function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="flex items-center justify-between gap-4 [&>*]:col-span-1">
      <AlertDescription>{message}</AlertDescription>
      <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
        Повторить
      </Button>
    </Alert>
  )
}

/** Пустой результат (правила 4.2, 9.4, 10.2). */
export function EmptyBlock({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border bg-card px-6 py-12 text-center">
      <h2 className="text-xl">{title}</h2>
      <p className="mt-1.5 mb-5 font-light text-muted-foreground">{text}</p>
      {action}
    </div>
  )
}
