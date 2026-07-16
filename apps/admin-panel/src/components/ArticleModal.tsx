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
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { ArticleWithAvailability } from "@bakery/api-client"
import { useCreateArticleMutation } from "@/hooks/useCreateArticleMutation"
import { useUpdateArticleMutation } from "@/hooks/useUpdateArticleMutation"

interface ArticleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article?: ArticleWithAvailability
}

const emptyForm = { name: "", price: "", capacityPerCycle: "" }

export function ArticleModal({ open, onOpenChange, article }: ArticleModalProps) {
  const { t } = useTranslation()
  const isEdit = article !== undefined
  const createMutation = useCreateArticleMutation()
  const updateMutation = useUpdateArticleMutation()

  const [form, setForm] = useState(emptyForm)
  const [available, setAvailable] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setForm({
        name: article?.name ?? "",
        price: article ? String(article.price) : "",
        capacityPerCycle: article?.capacityPerCycle != null ? String(article.capacityPerCycle) : "",
      })
      setAvailable(article?.available ?? true)
      setErrors({})
    }
  }, [open, article])

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = t("Required")
    const price = parseFloat(form.price)
    if (!form.price.trim() || isNaN(price) || price <= 0) newErrors.price = t("Required")
    if (form.capacityPerCycle.trim()) {
      const capacity = parseInt(form.capacityPerCycle, 10)
      if (isNaN(capacity) || capacity <= 0) newErrors.capacityPerCycle = t("Required")
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const capacityPerCycle = form.capacityPerCycle.trim()
      ? parseInt(form.capacityPerCycle, 10)
      : null

    const fields = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      available,
      capacityPerCycle,
    }

    const onSuccess = () => onOpenChange(false)

    if (isEdit) {
      updateMutation.mutate({ id: article.id, input: fields }, { onSuccess })
    } else {
      createMutation.mutate(fields, { onSuccess })
    }
  }

  const mutation = isEdit ? updateMutation : createMutation

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pr-10">
          <DialogTitle>{isEdit ? t("Edit Article") : t("New Article")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("Update article details") : t("Add a new article to the catalog")}
          </DialogDescription>
        </DialogHeader>

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">{t("Name")} *</label>
            <Input
              className={cn("mt-1", errors.name && "border-destructive")}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder={t("Article name")}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">{t("Price")} (RSD) *</label>
            <Input
              className={cn("mt-1", errors.price && "border-destructive")}
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              placeholder="0"
            />
            {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">{t("Capacity per cycle")}</label>
            <Input
              className={cn("mt-1", errors.capacityPerCycle && "border-destructive")}
              type="number"
              min="1"
              step="1"
              value={form.capacityPerCycle}
              onChange={(e) => setField("capacityPerCycle", e.target.value)}
              placeholder={t("Unlimited")}
            />
            {errors.capacityPerCycle && (
              <p className="text-xs text-destructive mt-1">{errors.capacityPerCycle}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t("Leave empty for unlimited capacity")}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("Available")}</label>
            <Switch checked={available} onCheckedChange={setAvailable} />
          </div>
        </form>

        <DialogFooter className="mt-2 border-t pt-4">
          <Button
            type="button"
            size="lg"
            disabled={mutation.isPending}
            onClick={handleSubmit}
            className="w-full font-semibold text-base"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Saving...")}
              </>
            ) : isEdit ? (
              t("Save Changes")
            ) : (
              t("Create Article")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
