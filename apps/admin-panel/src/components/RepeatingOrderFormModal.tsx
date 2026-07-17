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
import { Loader2 } from "lucide-react"
import { useArticlesQuery } from "@/hooks/useArticlesQuery"
import { useCreateRepeatingOrderMutation } from "@/hooks/useCreateRepeatingOrderMutation"
import { useUpdateRepeatingOrderMutation } from "@/hooks/useUpdateRepeatingOrderMutation"
import { cn } from "@/lib/utils"
import type { RepeatingOrder } from "@bakery/api-client"
import { OrderItemsEditor, type OrderItemState } from "@/components/OrderItemsEditor"

interface RepeatingOrderFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repeatingOrder?: RepeatingOrder
}

type ItemState = OrderItemState

const LOCATIONS = ["Hajdukovo", "Subotica"] as const

const emptyForm = {
  recipient: "",
  phone: "",
  email: "",
  location: "",
  remark: "",
}

const emptyItem: ItemState = { articleId: "", quantity: 1 }

export function RepeatingOrderFormModal({ open, onOpenChange, repeatingOrder }: RepeatingOrderFormModalProps) {
  const { t } = useTranslation()
  const isEdit = repeatingOrder !== undefined
  const { data: articlesData, isLoading: articlesLoading } = useArticlesQuery()
  const createMutation = useCreateRepeatingOrderMutation()
  const updateMutation = useUpdateRepeatingOrderMutation()
  const mutation = isEdit ? updateMutation : createMutation

  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState<ItemState[]>([{ ...emptyItem }])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const articles = useMemo(() => articlesData ?? [], [articlesData])

  useEffect(() => {
    if (open) {
      setForm({
        recipient: repeatingOrder?.recipient ?? "",
        phone: repeatingOrder?.phone ?? "",
        email: repeatingOrder?.email ?? "",
        location: repeatingOrder?.location ?? "",
        remark: repeatingOrder?.remark ?? "",
      })
      setItems(
        repeatingOrder?.items?.length
          ? repeatingOrder.items.map((item) => ({ articleId: item.articleId, quantity: item.quantity }))
          : [{ articleId: articles[0]?.id ?? "", quantity: 1 }]
      )
      setErrors({})
    }
    // Deliberately excludes `articles` — see OrderFormModal's identical effect for why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, repeatingOrder])

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
      updateMutation.mutate({ id: repeatingOrder.id, input: fields }, { onSuccess })
    } else {
      createMutation.mutate(fields, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-10">
          <DialogTitle>{isEdit ? t("Edit Repeating Order") : t("New Repeating Order")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("Update repeating order details") : t("Add a new standing weekly order")}
          </DialogDescription>
        </DialogHeader>

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-6 py-2">
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

          {/* Repeating items */}
          <div>
            <p className="text-sm font-medium mb-3">{t("Ordered Articles")}</p>
            <OrderItemsEditor
              items={items}
              articles={articles}
              errors={errors}
              isLoading={articlesLoading}
              onUpdateItem={updateItem}
              onAddItem={addItem}
              onRemoveItem={removeItem}
            />
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
              t("Create Repeating Order")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
