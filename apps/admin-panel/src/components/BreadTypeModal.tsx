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
import { BreadType } from "@/types/breadType"
import { useCreateBreadTypeMutation } from "@/hooks/useCreateBreadTypeMutation"
import { useUpdateBreadTypeMutation } from "@/hooks/useUpdateBreadTypeMutation"

interface BreadTypeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  breadType?: BreadType
}

const emptyForm = { name: "", price: "" }

export function BreadTypeModal({ open, onOpenChange, breadType }: BreadTypeModalProps) {
  const { t } = useTranslation()
  const isEdit = breadType !== undefined
  const createMutation = useCreateBreadTypeMutation()
  const updateMutation = useUpdateBreadTypeMutation()
  const mutation = isEdit ? updateMutation : createMutation

  const [form, setForm] = useState(emptyForm)
  const [available, setAvailable] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({ name: breadType?.name ?? "", price: breadType ? String(breadType.price) : "" })
      setAvailable(breadType?.available ?? true)
      setErrors({})
      setSubmitError(null)
    }
  }, [open, breadType])

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = t("Required")
    const price = parseFloat(form.price)
    if (!form.price.trim() || isNaN(price) || price <= 0) newErrors.price = t("Required")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    setSubmitError(null)

    const payload: BreadType = {
      id: isEdit ? breadType!.id : crypto.randomUUID(),
      name: form.name.trim(),
      price: parseFloat(form.price),
      available,
    }

    mutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
      onError: (err) => setSubmitError(err.message),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pr-10">
          <DialogTitle>{isEdit ? t("Edit Bread Type") : t("New Bread Type")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("Update bread type details") : t("Add a new bread type to the catalog")}
          </DialogDescription>
        </DialogHeader>

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">{t("Name")} *</label>
            <Input
              className={cn("mt-1", errors.name && "border-destructive")}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder={t("Bread type name")}
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

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("Available")}</label>
            <Switch checked={available} onCheckedChange={setAvailable} />
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
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
              t("Create Bread Type")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
