import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { orderFormSchema, type OrderFormValues } from "@/schemas/orderSchemas";
import type { PublicArticle } from "@bakery/api-client";
import type { OrderSummary } from "@/types/orderTypes";
import {
  getItemTotal,
  getTotalPrice,
  findArticleById,
} from "@/utils/calculations";
import { usePersistedCustomer } from "@/hooks/usePersistedCustomer";
import { CustomerFields } from "./CustomerFields";
import { OrderItems } from "./OrderItems";
import { OrderSummaryModal } from "./OrderSummaryModal";

interface OrderFormProps {
  articles: PublicArticle[];
  acceptingOrders: boolean;
}

const defaultItem = (
  firstArticleId: string,
): { articleId: string; quantity: number } => ({
  articleId: firstArticleId,
  quantity: 1,
});

export function OrderForm({ articles, acceptingOrders }: OrderFormProps) {
  const { t } = useTranslation();
  const { load: loadPersistedCustomer, save: savePersistedCustomer } =
    usePersistedCustomer();
  const [modalOpen, setModalOpen] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [lastSubmitted, setLastSubmitted] = useState<OrderSummary | null>(null);
  const onItemsUpdate = () => setUpdateTrigger((n) => n + 1);

  const firstArticleId = articles[0]?.id ?? "";

  const defaultValues: OrderFormValues = useMemo(() => {
    const persisted = loadPersistedCustomer();
    return {
      recipient: persisted?.recipient ?? "",
      phone: persisted?.phone ?? "",
      email: persisted?.email ?? "",
      location: persisted?.location ?? "",
      remark: "",
      repeat: false,
      items: firstArticleId ? [defaultItem(firstArticleId)] : [],
    };
  }, [firstArticleId, loadPersistedCustomer]);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
  });

  const { register, control, watch, handleSubmit, setValue, reset } = form;
  const items = watch("items");
  const formValues = watch();

  useEffect(() => {
    const persisted = loadPersistedCustomer();
    if (persisted?.recipient) setValue("recipient", persisted.recipient);
    if (persisted?.phone) setValue("phone", persisted.phone);
    if (persisted?.email) setValue("email", persisted.email ?? "");
    if (persisted?.location) setValue("location", persisted.location);
  }, [loadPersistedCustomer, setValue]);

  useEffect(() => {
    if (articles.length > 0 && (!items || items.length === 0)) {
      setValue("items", [defaultItem(firstArticleId)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles.length, firstArticleId, setValue, items?.length]);

  const itemDetails = useMemo(() => {
    if (!items?.length) return [];
    return items.map((item) => {
      const article = findArticleById(articles, item.articleId);
      const unitPrice = article?.price ?? 0;
      const quantity = Math.max(1, item.quantity);
      const total = getItemTotal(unitPrice, quantity);
      return {
        articleId: item.articleId,
        name: article?.name ?? "",
        quantity,
        unitPrice,
        total,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, articles, updateTrigger]);

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

  const buildSummary = (values: OrderFormValues): OrderSummary => ({
    recipient: values.recipient,
    phone: values.phone,
    email: values.email?.trim() || null,
    location: values.location,
    remark: values.remark?.trim() || null,
    repeat: values.repeat,
    items: itemDetails,
    totalPrice,
  });

  const onSubmit = (values: OrderFormValues) => {
    savePersistedCustomer({
      recipient: values.recipient,
      email: values.email ?? "",
      phone: values.phone,
      location: values.location,
    });
    setModalOpen(true);
  };

  const onModalClose = () => {
    setModalOpen(false);
  };

  const onOrderSuccess = (summary: OrderSummary) => {
    const currentValues = form.getValues();
    savePersistedCustomer({
      recipient: currentValues.recipient,
      email: currentValues.email ?? "",
      phone: currentValues.phone,
      location: currentValues.location,
    });
    reset({
      ...currentValues,
      remark: "",
      repeat: false,
      items: [defaultItem(firstArticleId)],
    });
    setModalOpen(false);
    setLastSubmitted(summary);
  };

  const handleOrderAgain = () => {
    setLastSubmitted(null);
  };

  const modalSummary = modalOpen ? buildSummary(formValues) : null;

  const hasItems = Array.isArray(items) && items.length > 0;
  const submitDisabled = !hasItems || !acceptingOrders;

  if (lastSubmitted) {
    return (
      <div className="bg-bakery-card p-6 rounded-2xl max-w-[720px] mx-auto shadow-xl text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold mb-2">{t("Order received!")}</h2>
        <p className="text-bakery-text/80">
          {t("Thank you, {{recipient}} — we've got your order.", { recipient: lastSubmitted.recipient })}
        </p>
        {lastSubmitted.repeat && (
          <p className="mt-2 text-sm text-bakery-text/70">
            {t("This order will repeat automatically every week.")}
          </p>
        )}
        <div className="text-left mt-5 border-t border-bakery-border pt-4">
          {lastSubmitted.items.map((item, i) => (
            <div key={i} className="py-1.5 flex justify-between text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span>{item.total} {t("RSD")}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold pt-3 mt-2 border-t border-bakery-border">
            <span>{t("Total:")}</span>
            <span>{lastSubmitted.totalPrice} {t("RSD")}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOrderAgain}
          className="mt-6 rounded-xl border-none py-2.5 px-6 text-[0.95rem] font-medium cursor-pointer transition-colors bg-bakery-primary text-white hover:bg-bakery-primary-hover"
        >
          {t("Place another order")}
        </button>
      </div>
    );
  }

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
          articles={articles}
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

        <label className="flex items-start gap-3 mt-4 cursor-pointer">
          <input
            type="checkbox"
            {...register("repeat")}
            className="mt-1 h-4 w-4 rounded border-bakery-border accent-bakery-primary shrink-0"
          />
          <span>
            <span className="block font-medium">{t("Repeat this order every week")}</span>
            <span className="block text-sm text-bakery-text/70 mt-0.5">
              {t("Get this same order automatically every week — you won't need to submit it again unless you want to change or cancel it.")}
            </span>
          </span>
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
        summary={modalSummary}
        onSuccess={onOrderSuccess}
      />
    </>
  );
}
