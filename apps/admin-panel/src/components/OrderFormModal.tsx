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
import { useCurrentCycleQuery } from "@/hooks/useCurrentCycleQuery"
import { useCreateOrderMutation } from "@/hooks/useCreateOrderMutation"
import { useUpdateOrderMutation } from "@/hooks/useUpdateOrderMutation"
import { cn } from "@/lib/utils"
import type { Order } from "@bakery/api-client"

interface OrderFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: Order
}

type ItemState = { articleId: string; quantity: number }

const LOCATIONS = ["Hajdukovo", "Subotica"] as const

const emptyForm = {
  recipient: "",
  phone: "",
  email: "",
  location: "",
  remark: "",
}

const emptyItem: ItemState = { articleId: "", quantity: 1 }

export function OrderFormModal({ open, onOpenChange, order }: OrderFormModalProps) {
  const { t } = useTranslation()
  const isEdit = order !== undefined
  const { data: articlesData, isLoading: articlesLoading } = useArticlesQuery()
  const { data: currentCycle, isLoading: cycleLoading } = useCurrentCycleQuery()
  const createMutation = useCreateOrderMutation()
  const updateMutation = useUpdateOrderMutation()
  const mutation = isEdit ? updateMutation : createMutation

  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState<ItemState[]>([{ ...emptyItem }])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const articles = useMemo(() => articlesData ?? [], [articlesData])

  useEffect(() => {
    if (open) {
      setForm({
        recipient: order?.recipient ?? "",
        phone: order?.phone ?? "",
        email: order?.email ?? "",
        location: order?.location ?? "",
        remark: order?.remark ?? "",
      })
      setItems(
        order?.items?.length
          ? order.items.map((item) => ({ articleId: item.articleId, quantity: item.quantity }))
          : [{ articleId: articles[0]?.id ?? "", quantity: 1 }]
      )
      setErrors({})
    }
    // Deliberately excludes `articles`: it's only read for its current value
    // when the modal opens. Including it would re-run this reset whenever the
    // article list changes while the modal is open, wiping user-entered items.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order])

  // Covers the case where the article list finishes loading after the modal
  // is already open and an item still has no selection.
  useEffect(() => {
    if (articles.length > 0) {
      setItems((prev) =>
        prev.map((item) => (item.articleId === "" ? { ...item, articleId: articles[0].id } : item))
      )
    }
  }, [articles])

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const addItem = () => {
    setItems((prev) => [...prev, { articleId: articles[0]?.id ?? "", quantity: 1 }])
    setErrors((prev) => { const next = { ...prev }; delete next.items; return next })
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ItemState, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const getItemTotal = (item: ItemState) => {
    const article = articles.find((a) => a.id === item.articleId)
    return article ? article.price * item.quantity : 0
  }

  const totalPrice = items.reduce((sum, item) => sum + getItemTotal(item), 0)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.recipient.trim()) newErrors.recipient = t("Required")
    if (!form.phone.trim()) newErrors.phone = t("Required")
    if (!form.location) newErrors.location = t("Required")
    if (items.length === 0) newErrors.items = t("At least one item required")
    items.forEach((item, i) => {
      if (!item.articleId) newErrors[`item_${i}_article`] = t("Required")
      if (item.quantity < 1) newErrors[`item_${i}_qty`] = t("Required")
    })
    if (!isEdit && !currentCycle) newErrors.cycle = t("No cycle is currently open")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const fields = {
      recipient: form.recipient.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      location: form.location,
      remark: form.remark.trim() || null,
      items: items.map((item) => ({ articleId: item.articleId, quantity: item.quantity })),
    }

    const onSuccess = () => onOpenChange(false)

    if (isEdit) {
      updateMutation.mutate({ id: order.id, input: fields }, { onSuccess })
    } else {
      createMutation.mutate({ ...fields, cycleId: currentCycle!.id }, { onSuccess })
    }
  }

  const isLoadingDeps = articlesLoading || (!isEdit && cycleLoading)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-10">
          <DialogTitle>{isEdit ? t("Edit Order") : t("Manual Order")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("Update order details") : t("Create a new order manually")}
          </DialogDescription>
        </DialogHeader>

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-6 py-2">
          {!isEdit && !cycleLoading && !currentCycle && (
            <p className="text-sm text-destructive">{t("No cycle is currently open")}</p>
          )}

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">{t("Recipient")} *</label>
              <Input
                className={cn("mt-1", errors.recipient && "border-destructive")}
                value={form.recipient}
                onChange={(e) => setField("recipient", e.target.value)}
              />
              {errors.recipient && <p className="text-xs text-destructive mt-1">{errors.recipient}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">{t("Phone")} *</label>
              <Input
                type="tel"
                autoComplete="tel"
                className={cn("mt-1", errors.phone && "border-destructive")}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">{t("Email")}</label>
              <Input
                className="mt-1"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">{t("Location")} *</label>
              <div className="mt-1">
                <Select value={form.location} onValueChange={(val) => setField("location", val)}>
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
              {errors.location && <p className="text-xs text-destructive mt-1">{errors.location}</p>}
            </div>
          </div>

          <Separator />

          {/* Order items */}
          <div>
            <p className="text-sm font-medium mb-3">{t("Ordered Articles")}</p>
            {isLoadingDeps ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("Loading orders...")}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => {
                  const article = articles.find((a) => a.id === item.articleId)
                  const itemTotal = article ? article.price * item.quantity : 0
                  return (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <select
                          value={item.articleId}
                          onChange={(e) => updateItem(i, "articleId", e.target.value)}
                          className={cn(
                            "w-full border rounded-md px-3 py-2 text-sm bg-background",
                            errors[`item_${i}_article`] ? "border-destructive" : "border-input"
                          )}
                        >
                          <option value="">{t("Select article...")}</option>
                          {articles.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.price} {t("RSD")})
                            </option>
                          ))}
                        </select>
                        {errors[`item_${i}_article`] && (
                          <p className="text-xs text-destructive mt-0.5">{errors[`item_${i}_article`]}</p>
                        )}
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
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

                {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  disabled={articles.length === 0}
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
        </form>

        <DialogFooter className="mt-2 flex w-full flex-col border-t pt-4 sm:flex-col">
          <Button
            type="button"
            size="lg"
            disabled={mutation.isPending || (!isEdit && !currentCycle)}
            onClick={handleSubmit}
            className="w-full font-semibold text-base"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Creating...")}
              </>
            ) : isEdit ? (
              t("Save Changes")
            ) : (
              t("Create Order")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
