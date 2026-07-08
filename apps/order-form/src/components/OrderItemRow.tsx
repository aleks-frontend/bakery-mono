import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Controller,
  type Control,
  type UseFieldArrayRemove,
} from "react-hook-form";
import Select from "react-select";
import type { OrderFormValues } from "@/schemas/orderSchemas";
import type { BreadType } from "@/types/orderTypes";

interface OrderItemRowProps {
  control: Control<OrderFormValues>;
  breadTypes: BreadType[];
  index: number;
  onRemove: UseFieldArrayRemove;
  onUpdate: () => void;
}

export function OrderItemRow({
  control,
  breadTypes,
  index,
  onRemove,
  onUpdate,
}: OrderItemRowProps) {
  const { t } = useTranslation();
  const breadOptions = useMemo(
    () =>
      breadTypes.map((b) => ({
        value: b.id,
        label: `${b.name} (${b.price} ${t("RSD")})`,
      })),
    [breadTypes, t]
  );

  return (
    <div className="p-2 bg-[rgb(250,248,244)] border border-bakery-border rounded-lg mb-3 last:mb-0">
      <div className="flex gap-3 items-end">
        <Controller
          name={`items.${index}.breadId`}
          control={control}
          render={({ field: breadField }) => (
            <Select
              options={breadOptions}
              value={
                breadOptions.find((o) => o.value === breadField.value) ?? null
              }
              onChange={(opt) => {
                breadField.onChange(opt?.value ?? "");
                onUpdate();
              }}
              onBlur={breadField.onBlur}
              ref={breadField.ref}
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
          className="flex-shrink-0 text-red-700 py-2 px-2.5 rounded-xl hover:text-red-800 remove-btn"
          aria-label="Remove item"
        >
          ✖
        </button>
      </div>
    </div>
  );
}
