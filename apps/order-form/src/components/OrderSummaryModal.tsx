import { useTranslation } from "react-i18next";
import Modal from "react-modal";
import { useSubmitOrder } from "@/hooks/useSubmitOrder";
import { Spinner } from "./Spinner";
import type { OrderSummary } from "@/types/orderTypes";
import type { CreatePublicOrderInput } from "@bakery/api-client";

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: OrderSummary | null;
  onSuccess: (summary: OrderSummary) => void;
}

function toCreateOrderInput(summary: OrderSummary): CreatePublicOrderInput {
  return {
    recipient: summary.recipient,
    phone: summary.phone,
    email: summary.email,
    location: summary.location,
    remark: summary.remark,
    repeat: summary.repeat,
    items: summary.items.map((item) => ({ articleId: item.articleId, quantity: item.quantity })),
  };
}

export function OrderSummaryModal({
  isOpen,
  onClose,
  summary,
  onSuccess,
}: OrderSummaryModalProps) {
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useSubmitOrder();

  const handleConfirm = () => {
    if (!summary) return;
    mutateAsync(toCreateOrderInput(summary))
      .then(() => onSuccess(summary))
      .catch(() => {
        // Error already surfaced via the toast in useSubmitOrder
      });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel={t("Confirm Order")}
      className="bg-bakery-card rounded-2xl p-8 max-w-[500px] w-[90%] max-h-[90vh] overflow-y-auto shadow-2xl mx-auto outline-none"
      overlayClassName="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4"
      shouldCloseOnOverlayClick={!isPending}
      shouldCloseOnEsc={!isPending}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold m-0">{t("Confirm Order")}</h3>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="bg-transparent border-none text-2xl cursor-pointer text-bakery-text p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-bakery-border disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {summary && (
        <div className="mb-6">
          <div className="mb-4">
            <strong>{t("Customer:")}</strong>
            <br />
            {summary.recipient}
            <br />
            {summary.phone}
            {summary.email ? (
              <>
                <br />
                {summary.email}
              </>
            ) : null}
            {summary.location ? (
              <>
                <br />
                <br />
                <strong>{t("Location:")}</strong> {t(summary.location)}
              </>
            ) : null}
          </div>
          <div className="mb-4">
            <strong>{t("Order Items:")}</strong>
            {summary.items.map((item, i) => (
              <div
                key={i}
                className="py-3 border-b border-bakery-border last:border-b-0"
              >
                {item.name} × {item.quantity} = {item.total} {t("RSD")}
              </div>
            ))}
          </div>
          <div className="text-xl font-semibold text-right pt-4 border-t-2 border-bakery-border">
            {t("Total:")} {summary.totalPrice} {t("RSD")}
          </div>
          {summary.repeat && (
            <div className="mt-4 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-blue-900">
              {t("This order will repeat automatically every week until you ask us to stop.")}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4 justify-end items-center">
        {isPending ? (
          <div className="flex justify-center items-center py-2">
            <Spinner />
          </div>
        ) : (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl border-none font-medium cursor-pointer bg-bakery-border text-bakery-text hover:bg-[#d4c5b0]"
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!summary || isPending}
              className="py-2.5 px-6 rounded-xl border-none font-medium cursor-pointer bg-bakery-primary text-white hover:bg-bakery-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("Confirm Order")}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
