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
import { useStartCycleSuggestionQuery } from "@/hooks/useStartCycleSuggestionQuery"
import { useStartCycleMutation } from "@/hooks/useStartCycleMutation"
import { useArticlesQuery } from "@/hooks/useArticlesQuery"

interface StartCycleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyForm = {
  label: "",
  deliveryDate: "",
}

// deliveryDate is a calendar date, not a real-world instant, so it's always
// read/written against UTC fields — never the browser's local timezone. Using
// local time here made the picked date round-trip differently depending on
// where it was read: an admin in Europe/Belgrade picking "Sep 2" would send
// 2026-09-01T22:00:00Z, which then rendered as "Sep 1" wherever it was later
// formatted in UTC (e.g. the backend's order-confirmation email, which runs
// in a UTC container) — a day off from what was actually picked.
function toDateInputValue(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function fromDateInputValue(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

export function StartCycleModal({ open, onOpenChange }: StartCycleModalProps) {
  const { t } = useTranslation()
  const { data: suggestion, isLoading: suggestionLoading } = useStartCycleSuggestionQuery(open)
  const { data: articles } = useArticlesQuery()
  const startMutation = useStartCycleMutation()

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedSeasonalIds, setSelectedSeasonalIds] = useState<string[]>([])

  const seasonalArticles = (articles ?? []).filter((article) => article.isSeasonal)

  useEffect(() => {
    if (open && suggestion) {
      setForm({
        label: suggestion.label,
        deliveryDate: toDateInputValue(suggestion.deliveryDate),
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

  // Seasonal articles default to unavailable every cycle, so the picker
  // always opens blank — nothing carries over from the previous cycle.
  useEffect(() => {
    if (open) setSelectedSeasonalIds([])
  }, [open])

  const toggleSeasonalArticle = (articleId: string, checked: boolean) => {
    setSelectedSeasonalIds((prev) =>
      checked ? [...prev, articleId] : prev.filter((id) => id !== articleId)
    )
  }

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.label.trim()) newErrors.label = t("Required")
    if (!form.deliveryDate) newErrors.deliveryDate = t("Required")

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    startMutation.mutate(
      {
        label: form.label.trim(),
        deliveryDate: fromDateInputValue(form.deliveryDate),
        seasonalArticleIds: selectedSeasonalIds,
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
            {t("Suggested delivery date is pre-filled — adjust it if this cycle needs a different one.")}
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
              <label className="text-sm font-medium">{t("Delivery Date")} *</label>
              <Input
                className={cn("mt-1", errors.deliveryDate && "border-destructive")}
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setField("deliveryDate", e.target.value)}
              />
              {errors.deliveryDate && <p className="text-xs text-destructive mt-1">{errors.deliveryDate}</p>}
            </div>

            {seasonalArticles.length > 0 && (
              <div>
                <label className="text-sm font-medium">{t("Seasonal articles")}</label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("Off by default — check the ones available this cycle.")}
                </p>
                <div className="mt-2 max-h-40 overflow-y-auto rounded-md border divide-y">
                  {seasonalArticles.map((article) => (
                    <label
                      key={article.id}
                      className="flex items-center gap-2 py-2 px-3 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-primary"
                        checked={selectedSeasonalIds.includes(article.id)}
                        onChange={(e) => toggleSeasonalArticle(article.id, e.target.checked)}
                      />
                      {article.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
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
