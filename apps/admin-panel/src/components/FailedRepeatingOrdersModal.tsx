import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useCloneFailuresQuery } from "@/hooks/useCloneFailuresQuery"
import { useResolveCloneFailureMutation } from "@/hooks/useResolveCloneFailureMutation"
import { OrderFormModal } from "@/components/OrderFormModal"
import { describeItemValidationError } from "@/lib/itemValidationErrors"
import type { Order, RepeatingOrderCloneFailure } from "@bakery/api-client"

interface FailedRepeatingOrdersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cycleId: string
}

export function FailedRepeatingOrdersModal({ open, onOpenChange, cycleId }: FailedRepeatingOrdersModalProps) {
  const { t } = useTranslation()
  const { data: failures = [], isLoading } = useCloneFailuresQuery(cycleId, open)
  const resolveMutation = useResolveCloneFailureMutation(cycleId)
  const [recreating, setRecreating] = useState<RepeatingOrderCloneFailure | null>(null)

  const handleCreated = (failure: RepeatingOrderCloneFailure, order: Order) => {
    resolveMutation.mutate({ failureId: failure.id, orderId: order.id })
    setRecreating(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Failed repeating orders")}</DialogTitle>
            <DialogDescription>
              {t("These repeating orders couldn't be added to this cycle automatically. Review the reason below and create the order manually if it should still go out.")}
            </DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          {!isLoading && failures.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">{t("Nothing left to review.")}</p>
          )}

          <div className="space-y-4">
            {failures.map((failure, index) => (
              <div key={failure.id}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">{failure.repeatingOrder.recipient}</p>
                      <p className="text-xs text-muted-foreground">
                        {failure.repeatingOrder.phone} · {failure.repeatingOrder.location}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setRecreating(failure)}>
                      {t("Create Order")}
                    </Button>
                  </div>

                  <ul className="text-sm space-y-1">
                    {failure.repeatingOrder.items?.map((item) => {
                      const error = failure.errors.find((e) => e.articleId === item.articleId)
                      return (
                        <li key={item.id} className="flex items-center gap-2">
                          <span className={error ? "text-destructive" : undefined}>
                            {item.quantity}× {item.article?.name ?? item.articleId}
                          </span>
                          {error && (
                            <span className="flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
                              {describeItemValidationError(t, error)}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {recreating && (
        <OrderFormModal
          open={recreating !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setRecreating(null)
          }}
          repeatingOrderId={recreating.repeatingOrderId}
          prefill={{
            recipient: recreating.repeatingOrder.recipient,
            phone: recreating.repeatingOrder.phone,
            email: recreating.repeatingOrder.email,
            location: recreating.repeatingOrder.location,
            remark: recreating.repeatingOrder.remark,
            items:
              recreating.repeatingOrder.items?.map((item) => ({
                articleId: item.articleId,
                quantity: item.quantity,
              })) ?? [],
          }}
          onCreated={(order) => handleCreated(recreating, order)}
        />
      )}
    </>
  )
}
