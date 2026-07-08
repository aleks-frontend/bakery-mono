import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Controller,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from "react-hook-form";
import Select from "react-select";
import type { OrderFormValues } from "@/schemas/orderSchemas";

interface CustomerFieldsProps {
  register: UseFormRegister<OrderFormValues>;
  control: Control<OrderFormValues>;
  errors: FieldErrors<OrderFormValues>;
}

const LOCATION_OPTIONS = [
  { value: "subotica", labelKey: "Subotica" as const },
  { value: "hajdukovo", labelKey: "Hajdukovo" as const },
] as const;

export function CustomerFields({
  register,
  control,
  errors,
}: CustomerFieldsProps) {
  const { t } = useTranslation();
  const locationOptions = useMemo(
    () =>
      LOCATION_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(opt.labelKey),
      })),
    [t]
  );

  return (
    <>
      <label className="block font-medium">
        <span className="block">{t("First name")}</span>
        <input
          type="text"
          {...register("firstName")}
          className="mt-1.5 w-full py-2.5 px-3 rounded-[10px] border border-bakery-border text-[0.95rem] transition-colors focus:outline-none focus:border-bakery-primary focus:shadow-focus bg-white"
        />
        {errors.firstName?.message && (
          <span className="text-red-600 text-sm mt-1 block">
            {errors.firstName.message}
          </span>
        )}
      </label>

      <label className="block mt-4 font-medium">
        <span className="block">{t("Last name")}</span>
        <input
          type="text"
          {...register("lastName")}
          className="mt-1.5 w-full py-2.5 px-3 rounded-[10px] border border-bakery-border text-[0.95rem] transition-colors focus:outline-none focus:border-bakery-primary focus:shadow-focus bg-white"
        />
        {errors.lastName?.message && (
          <span className="text-red-600 text-sm mt-1 block">
            {errors.lastName.message}
          </span>
        )}
      </label>

      <label className="block mt-4 font-medium">
        <span className="block">{t("Phone number")}</span>
        <input
          type="tel"
          {...register("phone")}
          className="mt-1.5 w-full py-2.5 px-3 rounded-[10px] border border-bakery-border text-[0.95rem] transition-colors focus:outline-none focus:border-bakery-primary focus:shadow-focus bg-white"
        />
        {errors.phone?.message && (
          <span className="text-red-600 text-sm mt-1 block">
            {errors.phone.message}
          </span>
        )}
      </label>

      <label className="block mt-4 font-medium">
        <span className="block">{t("Email (optional)")}</span>
        <input
          type="email"
          {...register("email")}
          className="mt-1.5 w-full py-2.5 px-3 rounded-[10px] border border-bakery-border text-[0.95rem] transition-colors focus:outline-none focus:border-bakery-primary focus:shadow-focus bg-white"
        />
        {errors.email?.message && (
          <span className="text-red-600 text-sm mt-1 block">
            {errors.email.message}
          </span>
        )}
      </label>

      <label className="block mt-4 font-medium">
        <span className="block">{t("Location")}</span>
        <Controller
          name="location"
          control={control}
          render={({ field }) => (
            <Select
              options={locationOptions}
              value={
                locationOptions.find((o) => o.value === field.value) ?? null
              }
              onChange={(opt) => field.onChange(opt?.value ?? "")}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={t("Select location below")}
              className="mt-1.5 react-select-container"
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
        {errors.location?.message && (
          <span className="text-red-600 text-sm mt-1 block">
            {errors.location.message}
          </span>
        )}
      </label>
    </>
  );
}
