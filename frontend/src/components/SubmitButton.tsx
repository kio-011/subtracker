import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'

interface Props extends ComponentProps<typeof Button> {
  pending: boolean
  pendingText: string
}

/** Кнопка отправки: во время запроса недоступна, показывает индикатор и текст «Входим…». */
export function SubmitButton({ pending, pendingText, children, disabled, ...props }: Props) {
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
