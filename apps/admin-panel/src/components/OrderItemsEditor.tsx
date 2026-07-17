import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { Loader2, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ArticleWithAvailability } from "@bakery/api-client"

export type OrderItemState = { articleId: string; quantity: number }

interface OrderItemsEditorProps {
  items: OrderItemState[]
  articles: ArticleWithAvailability[]
  errors: Record<string, string>
  isLoading: boolean
  showPricing?: boolean
  onUpdateItem: (index: number, field: keyof OrderItemState, value: string | number) => void
  onAddItem: () => void
  onRemoveItem: (index: number) => void
}

export function OrderItemsEditor({
  items,
  articles,
  errors,
  isLoading,
  showPricing,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
}: OrderItemsEditorProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{t("Loading...")}</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const article = articles.find((a) => a.id === item.articleId)
        const itemTotal = article ? article.price * item.quantity : 0
        return (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">
              <select
                value={item.articleId}
                onChange={(e) => onUpdateItem(i, "articleId", e.target.value)}
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
                onChange={(e) => onUpdateItem(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-input rounded-md px-2 py-2 text-sm bg-background"
              />
            </div>
            {showPricing && (
              <div className="w-24 py-2 text-sm font-medium text-right shrink-0">
                {itemTotal} {t("RSD")}
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveItem(i)}
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
        onClick={onAddItem}
        disabled={articles.length === 0}
        className="mt-1"
      >
        <Plus className="h-4 w-4 mr-1" />
        {t("Add Item")}
      </Button>
    </div>
  )
}
