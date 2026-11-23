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
        <Logo onGlow className="absolute top-6 left-6 sm:left-7" />
        <section aria-label="О сервисе" className="relative hidden max-w-xl flex-1 lg:block">
          <div className="relative flex flex-col gap-8 overflow-hidden rounded-[var(--radius-frame)] border border-white/30 bg-black/20 p-10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] xl:p-12">
            {/* узор: точечная сетка и кольца в углу, как знак логотипа */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.28)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom_right,black,transparent_70%)]"
            />
            <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -top-16 -right-16 size-64 text-white/30" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="100" cy="100" r="90" />
              <circle cx="100" cy="100" r="64" />
              <circle cx="100" cy="100" r="38" />
              <path d="M100 10 A90 90 0 0 1 190 100" stroke="white" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <div className="relative flex flex-col gap-4">
              <p className="font-sans text-5xl leading-tight font-medium xl:text-6xl">Знайте, за что вы платите</p>
              <p className="max-w-md text-base text-white">Все подписки в одном месте: сколько уходит в месяц и в год и что спишут на этой неделе.</p>
            </div>
            <ul className="relative flex max-w-md flex-col">
              {POINTS.map((point) => (
                <li key={point} className="flex items-center gap-3 border-t border-white/30 py-3.5 first:border-t-0">
                  <Check aria-hidden="true" className="size-5 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
            <p className="relative text-sm text-white/90">Ваши данные видны только вам</p>
          </div>
        </section>
        <Card className="w-full max-w-[400px] gap-0 p-6 sm:p-7">{children}</Card>
      </div>
    </main>
  )
}
