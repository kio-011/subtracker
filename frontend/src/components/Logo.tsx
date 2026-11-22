import { cn } from '@/lib/utils'

/** Словесный знак «Subtracker» и абстрактное кольцо с малиновой дугой. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-sans text-lg font-semibold text-foreground', className)}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <circle cx="11" cy="11" r="9" fill="none" stroke="#4a1a22" strokeWidth="3" />
        <path d="M11 2 A9 9 0 0 1 20 11" fill="none" stroke="#ea2845" strokeWidth="3" strokeLinecap="round" />
      </svg>
      Subtracker
    </span>
  )
}
