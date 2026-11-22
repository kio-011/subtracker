import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'
import { Card } from '@/components/ui/card'

/** Экран входа и регистрации: рамка со свечением и карточка с формой по центру. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh p-3 sm:p-4">
      <div className="glow-frame relative flex min-h-[calc(100dvh-1.5rem)] items-center justify-center rounded-[var(--radius-card)] px-4 pt-20 pb-8 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[var(--radius-frame)]">
        <Logo className="absolute top-6 left-6 sm:left-7" />
        <Card className="w-full max-w-[400px] gap-0 p-6 sm:p-7">{children}</Card>
      </div>
    </main>
  )
}
