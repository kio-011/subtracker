import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'
import { Card } from '@/components/ui/card'

const POINTS = ['Расход за месяц и за год одним числом', 'Напоминание о ближайших списаниях', 'Бесплатно и без ограничения числа подписок']

/** Экран входа и регистрации: рамка со свечением, слева рассказ о сервисе (только на широком экране), справа карточка с формой. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh p-3 sm:p-4">
      <div className="glow-frame relative flex min-h-[calc(100dvh-1.5rem)] items-center justify-center rounded-[var(--radius-card)] px-4 pt-20 pb-8 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[var(--radius-frame)] lg:justify-between lg:gap-16 lg:px-16 xl:px-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden rounded-[inherit] bg-gradient-to-r from-black/35 via-black/10 to-transparent lg:block" />
        <Logo onGlow className="absolute top-6 left-6 sm:left-7" />
        <section aria-label="О сервисе" className="relative hidden max-w-xl flex-1 flex-col gap-8 text-white lg:flex">
          <div className="flex flex-col gap-4">
            <p className="font-sans text-5xl leading-tight font-medium xl:text-6xl">Знайте, за что вы платите</p>
            <p className="max-w-md font-sans text-lg leading-relaxed text-white">Все подписки в одном месте: сколько уходит в месяц и в год и что спишут на этой неделе.</p>
          </div>
          <ul className="flex max-w-md flex-col">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 border-t border-white/30 py-3.5 font-sans text-base font-medium first:border-t-0">
                <Check aria-hidden="true" className="size-5 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
          <p className="font-sans text-sm text-white/90">Ваши данные видны только вам</p>
        </section>
        <Card className="relative w-full max-w-[400px] gap-0 p-6 sm:p-7">{children}</Card>
      </div>
    </main>
  )
}
