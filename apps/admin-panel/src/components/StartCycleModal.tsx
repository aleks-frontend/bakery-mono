import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useNextCycleSuggestionQuery } from "@/hooks/useNextCycleSuggestionQuery"
import { useStartCycleMutation } from "@/hooks/useStartCycleMutation"

interface StartCycleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyForm = {
  label: "",
  orderWindowOpensAt: "",
  orderWindowClosesAt: "",
  deliveryDate: "",
  holidayMessage: "",
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function fromDateInputValue(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

export function StartCycleModal({ open, onOpenChange }: StartCycleModalProps) {
  const { t } = useTranslation()
  const { data: suggestion, isLoading: suggestionLoading } = useNextCycleSuggestionQuery(open)
  const startMutation = useStartCycleMutation()

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && suggestion) {
      setForm({
        label: suggestion.label,
        orderWindowOpensAt: toDateInputValue(suggestion.orderWindowOpensAt),
        orderWindowClosesAt: toDateInputValue(suggestion.orderWindowClosesAt),
        deliveryDate: toDateInputValue(suggestion.deliveryDate),
        holidayMessage: "",
      })
      setErrors({})
    }
  }, [open, suggestion])

  useEffect(() => {
    if (!open) {
      setForm(emptyForm)
      setErrors({})
    }
  }, [open])

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.label.trim()) newErrors.label = t("Required")
    if (!form.orderWindowOpensAt) newErrors.orderWindowOpensAt = t("Required")
    if (!form.orderWindowClosesAt) newErrors.orderWindowClosesAt = t("Required")
    if (!form.deliveryDate) newErrors.deliveryDate = t("Required")

    if (form.orderWindowOpensAt && form.orderWindowClosesAt) {
      if (fromDateInputValue(form.orderWindowClosesAt) <= fromDateInputValue(form.orderWindowOpensAt)) {
        newErrors.orderWindowClosesAt = t("Must be after the opening date")
      }
    }
    if (form.orderWindowClosesAt && form.deliveryDate) {
      if (fromDateInputValue(form.deliveryDate) <= fromDateInputValue(form.orderWindowClosesAt)) {
        newErrors.deliveryDate = t("Must be after the closing date")
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    startMutation.mutate(
      {
        label: form.label.trim(),
        orderWindowOpensAt: fromDateInputValue(form.orderWindowOpensAt),
        orderWindowClosesAt: fromDateInputValue(form.orderWindowClosesAt),
        deliveryDate: fromDateInputValue(form.deliveryDate),
        holidayMessage: form.holidayMessage.trim() || null,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pr-10">
          <DialogTitle>{t("Start Next Cycle")}</DialogTitle>
          <DialogDescription>
            {t("Suggested dates are pre-filled — adjust them if this cycle needs to shift (e.g. for a holiday).")}
          </DialogDescription>
        </DialogHeader>

        {suggestionLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("Loading...")}</span>
          </div>
        ) : (
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">{t("Label")} *</label>
              <Input
                className={cn("mt-1", errors.label && "border-destructive")}
                value={form.label}
                onChange={(e) => setField("label", e.target.value)}
              />
              {errors.label && <p className="text-xs text-destructive mt-1">{errors.label}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">{t("Order Window Opens")} *</label>
              <Input
                className={cn("mt-1", errors.orderWindowOpensAt && "border-destructive")}
                type="date"
                value={form.orderWindowOpensAt}
                onChange={(e) => setField("orderWindowOpensAt", e.target.value)}
              />
              {errors.orderWindowOpensAt && (
                <p className="text-xs text-destructive mt-1">{errors.orderWindowOpensAt}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">{t("Order Window Closes")} *</label>
              <Input
                className={cn("mt-1", errors.orderWindowClosesAt && "border-destructive")}
                type="date"
                value={form.orderWindowClosesAt}
                onChange={(e) => setField("orderWindowClosesAt", e.target.value)}
              />
              {errors.orderWindowClosesAt && (
                <p className="text-xs text-destructive mt-1">{errors.orderWindowClosesAt}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">{t("Delivery Date")} *</label>
              <Input
                className={cn("mt-1", errors.deliveryDate && "border-destructive")}
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setField("deliveryDate", e.target.value)}
              />
              {errors.deliveryDate && <p className="text-xs text-destructive mt-1">{errors.deliveryDate}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">{t("Holiday Message")}</label>
              <textarea
                value={form.holidayMessage}
                onChange={(e) => setField("holidayMessage", e.target.value)}
                rows={2}
                placeholder={t("Shown to customers while ordering is closed (optional)")}
                className="mt-1 block w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none"
              />
            </div>
          </form>
        )}

        <DialogFooter className="mt-2 border-t pt-4">
          <Button
            type="button"
            size="lg"
            disabled={startMutation.isPending || suggestionLoading}
            onClick={handleSubmit}
            className="w-full font-semibold text-base"
          >
            {startMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Starting...")}
              </>
            ) : (
              t("Start Cycle")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
