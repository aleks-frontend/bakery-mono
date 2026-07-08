import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { orderFormSchema, type OrderFormValues } from "@/schemas/orderSchemas";
import type { BreadType } from "@/types/orderTypes";
import type { OrderPayload, OrderItemPayload } from "@/types/orderTypes";
import {
  getItemTotal,
  getTotalPrice,
  findBreadById,
} from "@/utils/calculations";
import { usePersistedCustomer } from "@/hooks/usePersistedCustomer";
import { CustomerFields } from "./CustomerFields";
import { OrderItems } from "./OrderItems";
import { OrderSummaryModal } from "./OrderSummaryModal";

interface OrderFormProps {
  breadTypes: BreadType[];
  acceptingOrders: boolean;
}

const defaultItem = (
  firstBreadId: string,
): { breadId: string; quantity: number } => ({
  breadId: firstBreadId,
  quantity: 1,
});

export function OrderForm({ breadTypes, acceptingOrders }: OrderFormProps) {
  const { t, i18n } = useTranslation();
  const { load: loadPersistedCustomer, save: savePersistedCustomer } =
    usePersistedCustomer();
  const [modalOpen, setModalOpen] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const onItemsUpdate = () => setUpdateTrigger((n) => n + 1);

  const firstBreadId = breadTypes[0]?.id ?? "";

  const defaultValues: OrderFormValues = useMemo(() => {
    const persisted = loadPersistedCustomer();
    return {
      firstName: persisted?.firstName ?? "",
      lastName: persisted?.lastName ?? "",
      phone: persisted?.phone ?? "",
      email: persisted?.email ?? "",
      location: persisted?.location ?? "",
      remark: "",
      items: firstBreadId ? [defaultItem(firstBreadId)] : [],
    };
  }, [firstBreadId, loadPersistedCustomer]);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
  });

  const { register, control, watch, handleSubmit, setValue, reset } = form;
  const items = watch("items");
  const formValues = watch();

  useEffect(() => {
    const persisted = loadPersistedCustomer();
    if (persisted?.firstName) setValue("firstName", persisted.firstName);
    if (persisted?.lastName) setValue("lastName", persisted.lastName);
    if (persisted?.phone) setValue("phone", persisted.phone);
    if (persisted?.email) setValue("email", persisted.email ?? "");
    if (persisted?.location) setValue("location", persisted.location);
  }, [loadPersistedCustomer, setValue]);

  useEffect(() => {
    if (breadTypes.length > 0 && (!items || items.length === 0)) {
      setValue("items", [defaultItem(firstBreadId)]);
    }
  }, [breadTypes.length, firstBreadId, setValue, items?.length]);

  const itemDetails = useMemo(() => {
    if (!items?.length) return [];
    return items.map((item) => {
      const bread = findBreadById(breadTypes, item.breadId);
      const unitPrice = bread?.price ?? 0;
      const quantity = Math.max(1, item.quantity);
      const total = getItemTotal(unitPrice, quantity);
      return {
        breadId: item.breadId,
        breadName: bread?.name ?? "",
        quantity,
        unitPrice,
        total,
      };
    });
  }, [items, breadTypes, updateTrigger]);

  const totalPrice = useMemo(
    () =>
      getTotalPrice(
        itemDetails.map((i) => ({
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      ),
    [itemDetails],
  );

  const buildPayload = (values: OrderFormValues): OrderPayload => {
    const orderItems: OrderItemPayload[] = itemDetails.map((d) => ({
      breadId: d.breadId,
      breadName: d.breadName,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
      total: d.total,
    }));
    return {
      customer: {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email?.trim() || "",
      },
      items: orderItems,
      totalPrice,
      submittedAt: new Date().toISOString(),
      location: values.location,
      remark: values.remark?.trim() || null,
      language: i18n.language,
    };
  };

  const onSubmit = (values: OrderFormValues) => {
    savePersistedCustomer({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email ?? "",
      phone: values.phone,
      location: values.location,
    });
    setModalOpen(true);
  };

  const onModalClose = () => {
    setModalOpen(false);
  };

  const onOrderSuccess = () => {
    const currentValues = form.getValues();
    savePersistedCustomer({
      firstName: currentValues.firstName,
      lastName: currentValues.lastName,
      email: currentValues.email ?? "",
      phone: currentValues.phone,
      location: currentValues.location,
    });
    reset({
      ...currentValues,
      remark: "",
      items: [defaultItem(firstBreadId)],
    });
    setModalOpen(false);
  };

  const modalPayload = modalOpen ? buildPayload(formValues) : null;

  const hasItems = Array.isArray(items) && items.length > 0;
  const submitDisabled = !hasItems || !acceptingOrders;

  if (!acceptingOrders) return null;

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-bakery-card p-4 rounded-2xl max-w-[720px] mx-auto shadow-xl"
      >
        <CustomerFields
          register={register}
          control={control}
          errors={form.formState.errors}
        />

        <OrderItems
          control={control}
          breadTypes={breadTypes}
          onUpdate={onItemsUpdate}
        />

        <div className="mt-6 text-right text-xl font-semibold">
          <span>{t("Total price:")}</span>
          <span className="ml-2">{totalPrice}</span>
          <span className="ml-1">{t("RSD")}</span>
        </div>

        <label className="block mt-4 font-medium">
          <span className="block">{t("Remark (optional)")}</span>
          <textarea
            {...register("remark")}
            rows={3}
            placeholder={t("Any additional notes or special requests...")}
            className="mt-1.5 w-full py-2.5 px-3 rounded-[10px] border border-bakery-border text-[0.95rem] min-h-[80px] resize-y focus:outline-none focus:border-bakery-primary focus:shadow-focus bg-white font-sans"
          />
        </label>

        <button
          type="submit"
          disabled={submitDisabled}
          className="mt-4 rounded-xl border-none py-2.5 px-4 text-[0.95rem] font-medium cursor-pointer transition-colors bg-bakery-primary text-white hover:bg-bakery-primary-hover disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:disabled:transform-none"
        >
          {t("Submit order")}
        </button>
      </form>

      <OrderSummaryModal
        isOpen={modalOpen}
        onClose={onModalClose}
        payload={modalPayload}
        onSuccess={onOrderSuccess}
      />
    </>
  );
}
