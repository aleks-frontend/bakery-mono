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
import { useNextCycleStartSuggestionQuery } from "@/hooks/useNextCycleStartSuggestionQuery"
import { useCloseCycleMutation } from "@/hooks/useCloseCycleMutation"

interface CloseCycleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cycleId: string
  cycleLabel: string
}

const emptyForm = {
  nextCycleStartDate: "",
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

export function CloseCycleModal({ open, onOpenChange, cycleId, cycleLabel }: CloseCycleModalProps) {
  const { t } = useTranslation()
  const { data: suggestion, isLoading: suggestionLoading } = useNextCycleStartSuggestionQuery(open)
  const closeMutation = useCloseCycleMutation()

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && suggestion) {
      setForm({
        nextCycleStartDate: toDateInputValue(suggestion.nextCycleStartDate),
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
    if (!form.nextCycleStartDate) newErrors.nextCycleStartDate = t("Required")

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    closeMutation.mutate(
      {
        id: cycleId,
        input: {
          nextCycleStartDate: fromDateInputValue(form.nextCycleStartDate),
          holidayMessage: form.holidayMessage.trim() || null,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pr-10">
          <DialogTitle>{t("Confirm Close Ordering")}</DialogTitle>
          <DialogDescription>
            {t("This will close ordering for cycle {{label}}. No more orders can be added to it.", {
              label: cycleLabel,
            })}
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
              <label className="text-sm font-medium">{t("Next order window opens")} *</label>
              <Input
                className={cn("mt-1", errors.nextCycleStartDate && "border-destructive")}
                type="date"
                value={form.nextCycleStartDate}
                onChange={(e) => setField("nextCycleStartDate", e.target.value)}
              />
              {errors.nextCycleStartDate && (
                <p className="text-xs text-destructive mt-1">{errors.nextCycleStartDate}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t("Shown to customers on the order form while ordering is closed.")}
              </p>
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

        <DialogFooter className="gap-2 mt-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={closeMutation.isPending}>
            {t("Cancel")}
          </Button>
          <Button
            variant="default"
            disabled={closeMutation.isPending || suggestionLoading}
            onClick={handleSubmit}
          >
            {closeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Closing...")}
              </>
            ) : (
              t("Close Ordering")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
