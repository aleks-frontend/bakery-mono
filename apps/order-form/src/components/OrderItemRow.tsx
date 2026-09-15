import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Controller,
  useWatch,
  type Control,
  type UseFieldArrayRemove,
} from "react-hook-form";
import Select from "react-select";
import type { OrderFormValues } from "@/schemas/orderSchemas";
import type { PublicArticle } from "@bakery/api-client";
import type { ResolvedItemError } from "@/lib/itemValidationErrors";

interface OrderItemRowProps {
  control: Control<OrderFormValues>;
  articles: PublicArticle[];
  index: number;
  onRemove: UseFieldArrayRemove;
  onUpdate: () => void;
  itemError?: ResolvedItemError;
  lowStockThreshold: number;
}

interface ArticleOption {
  value: string;
  label: string;
  lowStock: boolean;
}

export function OrderItemRow({
  control,
  articles,
  index,
  onRemove,
  onUpdate,
  itemError,
  lowStockThreshold,
}: OrderItemRowProps) {
  const { t } = useTranslation();
  const allItems = useWatch({ control, name: "items" });
  const currentArticleId = allItems?.[index]?.articleId ?? "";
  // Articles already chosen in *other* rows are hidden from this row's menu so the
  // same article can't be picked twice — but this row's own current value stays,
  // even if duplicated elsewhere, so its label keeps displaying correctly.
  const selectedElsewhere = useMemo(
    () =>
      new Set(
        (allItems ?? [])
          .filter((_, i) => i !== index)
          .map((item) => item.articleId)
          .filter(Boolean)
      ),
    [allItems, index]
  );
  const articleOptions = useMemo<ArticleOption[]>(
    () =>
      articles
        .filter((a) => a.id === currentArticleId || !selectedElsewhere.has(a.id))
        .map((a) => ({
          value: a.id,
          label: a.isSeasonal
            ? `${a.name} (${t("Seasonal")}) — ${a.price} ${t("RSD")}`
            : `${a.name} (${a.price} ${t("RSD")})`,
          lowStock: a.lowStock,
        })),
    [articles, t, selectedElsewhere, currentArticleId]
  );

  const isClamped = itemError?.action === "clamped";

  return (
    <div
      className={`p-2 border rounded-lg mb-3 last:mb-0 ${
        isClamped
          ? "bg-bakery-highlight-soft border-bakery-highlight"
          : "bg-bakery-bg-soft border-bakery-border"
      }`}
    >
      <div className="flex gap-3 items-end">
        <Controller
          name={`items.${index}.articleId`}
          control={control}
          render={({ field: articleField }) => (
            <Select
              options={articleOptions}
              value={
                articleOptions.find((o) => o.value === articleField.value) ?? null
              }
              onChange={(opt) => {
                articleField.onChange(opt?.value ?? "");
                onUpdate();
              }}
              onBlur={articleField.onBlur}
              ref={articleField.ref}
              formatOptionLabel={(option: ArticleOption, { context }) => (
                <span className="flex items-center gap-1.5">
                  <span>{option.label}</span>
                  {/* Only in the open menu — in the closed control (context "value")
                      it has no room and gets visually cut off. */}
                  {option.lowStock && context === "menu" && (
                    <span className="shrink-0 rounded-full bg-bakery-highlight-soft border border-bakery-highlight text-bakery-text text-[11px] font-medium px-2 py-0.5">
                      {t("Less than {{threshold}} available", { threshold: lowStockThreshold })}
                    </span>
                  )}
                </span>
              )}
              className="flex-[2] mt-0 react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: 42,
                  borderRadius: 10,
                  borderColor: "var(--bakery-border, #e5e7eb)",
                }),
              }}
            />
          )}
        />
        <Controller
          name={`items.${index}.quantity`}
          control={control}
          rules={{ min: 1 }}
          render={({ field: qtyField }) => (
            <input
              type="number"
              min={1}
              value={qtyField.value === 0 ? "" : qtyField.value}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                qtyField.onChange(isNaN(v) || v < 1 ? 0 : v);
                onUpdate();
              }}
              onBlur={() => {
                if (qtyField.value === 0) {
                  qtyField.onChange(1);
                  onUpdate();
                }
                qtyField.onBlur();
              }}
              className="w-12 min-w-[3rem] sm:w-14 sm:min-w-0 h-[42px] mt-0 py-0 px-2 sm:px-3 rounded-[10px] border border-bakery-border text-[0.95rem] focus:outline-none focus:border-bakery-primary focus:shadow-focus bg-white flex-shrink-0 box-border"
            />
          )}
        />
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="flex-shrink-0 text-bakery-destructive py-2 px-2.5 rounded-xl hover:bg-bakery-destructive-soft remove-btn"
          aria-label="Remove item"
        >
          ✖
        </button>
      </div>
      {isClamped && (
        <div className="mt-2 pt-2 border-t border-bakery-highlight/50 flex items-center gap-1.5">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className="h-4 w-4 shrink-0 text-bakery-primary"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.28 11.18c.75 1.334-.213 2.987-1.744 2.987H3.72c-1.53 0-2.493-1.653-1.744-2.987l6.28-11.18ZM10 7a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 7Zm0 7.25a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs font-medium text-bakery-text leading-none">{itemError.inlineMessage}</p>
        </div>
      )}
    </div>
  );
}
