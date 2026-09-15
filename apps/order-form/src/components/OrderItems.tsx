import { useTranslation } from "react-i18next";
import { useWatch, type Control, type FieldArrayWithId, type UseFieldArrayAppend, type UseFieldArrayRemove } from "react-hook-form";
import type { OrderFormValues } from "@/schemas/orderSchemas";
import type { PublicArticle } from "@bakery/api-client";
import type { ResolvedItemError } from "@/lib/itemValidationErrors";
import { OrderItemRow } from "./OrderItemRow";
import { OutOfStockArticles } from "./OutOfStockArticles";

interface OrderItemsProps {
  control: Control<OrderFormValues>;
  articles: PublicArticle[];
  outOfStockArticles: PublicArticle[];
  onUpdate: () => void;
  fields: FieldArrayWithId<OrderFormValues, "items", "id">[];
  append: UseFieldArrayAppend<OrderFormValues, "items">;
  remove: UseFieldArrayRemove;
  itemErrors: (ResolvedItemError | undefined)[];
  lowStockThreshold: number;
}

export function OrderItems({
  control,
  articles,
  outOfStockArticles,
  onUpdate,
  fields,
  append,
  remove,
  itemErrors,
  lowStockThreshold,
}: OrderItemsProps) {
  const { t } = useTranslation();
  const items = useWatch({ control, name: "items" });

  const handleAdd = () => {
    const selectedIds = new Set((items ?? []).map((item) => item.articleId));
    const nextArticle = articles.find((a) => !selectedIds.has(a.id));
    append({ articleId: nextArticle?.id ?? articles[0]?.id ?? "", quantity: 1 });
  };

  return (
    <>
      <h3 className="mt-6 text-left font-semibold">{t("Ordered products")}</h3>
      <div className="space-y-3 mt-3">
        {fields.map((field, index) => (
          <OrderItemRow
            key={field.id}
            control={control}
            articles={articles}
            index={index}
            onRemove={remove}
            onUpdate={onUpdate}
            itemError={itemErrors[index]}
            lowStockThreshold={lowStockThreshold}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border-none py-2.5 px-4 text-[0.95rem] font-medium cursor-pointer transition-colors bg-bakery-primary text-white hover:bg-bakery-primary-hover hover:-translate-y-px active:translate-y-0 add-article"
      >
        <span aria-hidden className="text-white text-base leading-none">+</span>
        {t("Add product")}
      </button>
      <OutOfStockArticles articles={outOfStockArticles} />
    </>
  );
}
