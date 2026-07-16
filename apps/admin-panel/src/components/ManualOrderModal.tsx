import { useEffect, useMemo, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "react-i18next"
import { Loader2, Plus, X } from "lucide-react"
import { useArticlesQuery } from "@/hooks/useArticlesQuery"
import { useCreateManualOrderMutation } from "@/hooks/useCreateManualOrderMutation"
import { cn } from "@/lib/utils"

interface ManualOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ItemState = { breadId: string; quantity: number }

const LOCATIONS = ["Hajdukovo", "Subotica"] as const

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  location: "",
  remark: "",
}

const emptyItem: ItemState = { breadId: "", quantity: 1 }

export function ManualOrderModal({ open, onOpenChange }: ManualOrderModalProps) {
  const { t } = useTranslation()
  const { data: articlesData, isLoading: breadTypesLoading } = useArticlesQuery()
  const createMutation = useCreateManualOrderMutation()

  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState<ItemState[]>([{ ...emptyItem }])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const breadTypes = useMemo(() => articlesData ?? [], [articlesData])

  useEffect(() => {
    if (!open) {
      setForm(emptyForm)
      setItems([{ ...emptyItem }])
      setErrors({})
      setSubmitError(null)
    }
  }, [open])

  // Pre-select first bread type when types load and item has no selection yet
  useEffect(() => {
    if (breadTypes.length > 0) {
      setItems((prev) =>
        prev.map((item) =>
          item.breadId === "" ? { ...item, breadId: breadTypes[0].id } : item
        )
      )
    }
  }, [breadTypes])

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const addItem = () => {
    setItems((prev) => [...prev, { breadId: breadTypes[0]?.id ?? "", quantity: 1 }])
    setErrors((prev) => { const next = { ...prev }; delete next.items; return next })
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ItemState, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const getItemTotal = (item: ItemState) => {
    const bread = breadTypes.find((b) => b.id === item.breadId)
    return bread ? bread.price * item.quantity : 0
  }

  const totalPrice = items.reduce((sum, item) => sum + getItemTotal(item), 0)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.firstName.trim()) newErrors.firstName = t("Required")
    if (!form.lastName.trim()) newErrors.lastName = t("Required")
    if (!form.phone.trim()) newErrors.phone = t("Required")
    if (!form.location) newErrors.location = t("Required")
    if (items.length === 0) newErrors.items = t("At least one item required")
    items.forEach((item, i) => {
      if (!item.breadId) newErrors[`item_${i}_bread`] = t("Required")
      if (item.quantity < 1) newErrors[`item_${i}_qty`] = t("Required")
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    setSubmitError(null)

    const payload = {
      customer: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      },
      items: items.map((item) => {
        const bread = breadTypes.find((b) => b.id === item.breadId)!
        return {
          breadId: item.breadId,
          breadName: bread.name,
          quantity: item.quantity,
          unitPrice: bread.price,
        }
      }),
      totalPrice,
      location: form.location,
      remark: form.remark.trim() || undefined,
    }

    createMutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
      onError: (err) => setSubmitError(err.message),
    })
  }

  const inputClass = "mt-1 block w-full"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-10">
          <DialogTitle>{t("Manual Order")}</DialogTitle>
          <DialogDescription>{t("Create a new order manually")}</DialogDescription>
        </DialogHeader>

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-6 py-2">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t("First Name")} *</label>
              <Input
                className={cn(inputClass, errors.firstName && "border-destructive")}
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">{t("Last Name")} *</label>
              <Input
                className={cn(inputClass, errors.lastName && "border-destructive")}
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">{t("Phone")} *</label>
              <Input
                type="tel"
                autoComplete="tel"
                className={cn(inputClass, errors.phone && "border-destructive")}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">{t("Email")}</label>
              <Input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">{t("Location")} *</label>
              <div className="mt-1">
                <Select
                  value={form.location}
                  onValueChange={(val) => setField("location", val)}
                >
                  <SelectTrigger className={cn(errors.location && "border-destructive")}>
                    <SelectValue placeholder={t("Select location...")} />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.location && (
                <p className="text-xs text-destructive mt-1">{errors.location}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Order items */}
          <div>
            <p className="text-sm font-medium mb-3">{t("Ordered Articles")}</p>
            {breadTypesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("Loading orders...")}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => {
                  const bread = breadTypes.find((b) => b.id === item.breadId)
                  const itemTotal = bread ? bread.price * item.quantity : 0
                  return (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <select
                          value={item.breadId}
                          onChange={(e) => updateItem(i, "breadId", e.target.value)}
                          className={cn(
                            "w-full border rounded-md px-3 py-2 text-sm bg-background",
                            errors[`item_${i}_bread`]
                              ? "border-destructive"
                              : "border-input"
                          )}
                        >
                          <option value="">{t("Select bread...")}</option>
                          {breadTypes.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.price} {t("RSD")})
                            </option>
                          ))}
                        </select>
                        {errors[`item_${i}_bread`] && (
                          <p className="text-xs text-destructive mt-0.5">
                            {errors[`item_${i}_bread`]}
                          </p>
                        )}
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-full border border-input rounded-md px-2 py-2 text-sm bg-background"
                        />
                      </div>
                      <div className="w-24 py-2 text-sm font-medium text-right shrink-0">
                        {itemTotal} {t("RSD")}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(i)}
                        disabled={items.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}

                {errors.items && (
                  <p className="text-xs text-destructive">{errors.items}</p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  disabled={breadTypes.length === 0}
                  className="mt-1"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("Add Item")}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Remark */}
          <div>
            <label className="text-sm font-medium">{t("Remark")}</label>
            <textarea
              value={form.remark}
              onChange={(e) => setField("remark", e.target.value)}
              rows={2}
              className="mt-1 block w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none"
            />
          </div>

          {/* Total */}
          <div className="flex justify-between items-center font-semibold text-sm">
            <span>{t("Total Price")}</span>
            <span>{totalPrice} {t("RSD")}</span>
          </div>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
        </form>

        <DialogFooter className="mt-2 flex w-full flex-col border-t pt-4 sm:flex-col">
          <Button
            type="button"
            size="lg"
            disabled={createMutation.isPending}
            onClick={handleSubmit}
            className="w-full font-semibold text-base"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Creating...")}
              </>
            ) : (
              t("Create Order")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
