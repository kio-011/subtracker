import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { subscriptionsApi } from '@/api/endpoints'
import type { Subscription } from '@/api/types'
import { SubmitButton } from '@/components/SubmitButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  subscription: Subscription | null
  onClose: () => void
  onDeleted: () => void
}

/** Подтверждение удаления (правило 9.7): пока идёт запрос, повторный клик ничего не создаёт. */
export function DeleteDialog({ subscription, onClose, onDeleted }: Props) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const submitting = useRef(false)

  async function confirm() {
    if (!subscription || submitting.current) return
    submitting.current = true
    setPending(true)
    setFailed(false)
    try {
      await subscriptionsApi.remove(subscription.id)
      toast.success('Подписка удалена')
      onClose()
      onDeleted()
    } catch {
      setFailed(true)
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  return (
    <Dialog
      open={subscription !== null}
      onOpenChange={(open) => {
        if (!open && !pending) {
          setFailed(false)
          onClose()
        }
      }}
    >
      <DialogContent role="alertdialog" aria-busy={pending} className="sm:max-w-[440px]">
        <DialogHeader className="text-left">
          <DialogTitle className="font-sans text-xl font-medium">
            Удалить подписку «{subscription?.name}»?
          </DialogTitle>
          <DialogDescription className="font-light">Это действие нельзя отменить.</DialogDescription>
        </DialogHeader>
        {failed && (
          <Alert variant="destructive">
            <AlertDescription>Не удалось удалить. Повторите попытку</AlertDescription>
          </Alert>
        )}
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="secondary" disabled={pending} onClick={onClose}>
            Отмена
          </Button>
          <SubmitButton type="button" pending={pending} pendingText="Удаляем…" onClick={confirm}>
            Удалить
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
