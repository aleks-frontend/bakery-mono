import { useTranslation } from "react-i18next";
import Modal from "react-modal";
import { useSubmitOrder } from "@/hooks/useSubmitOrder";
import { Spinner } from "./Spinner";
import type { OrderPayload } from "@/types/orderTypes";
import toast from "react-hot-toast";

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: OrderPayload | null;
  onSuccess: () => void;
}

const LOCATION_KEYS: Record<string, string> = {
  subotica: "Subotica",
  hajdukovo: "Hajdukovo",
};

export function OrderSummaryModal({
  isOpen,
  onClose,
  payload,
  onSuccess,
}: OrderSummaryModalProps) {
  const { t } = useTranslation();
  const { submitOrder, isPending } = useSubmitOrder({
    onSuccess: () => {
      toast.success(t("✅ Order submitted successfully!"));
      onSuccess();
    },
    onError: (message) => {
      toast.error(t(message));
    },
  });

  const handleConfirm = () => {
    if (!payload) return;
    submitOrder(payload).catch(() => {
      // Error already shown via onError with server message or fallback
    });
  };

  const locationLabel = payload?.location
    ? t(LOCATION_KEYS[payload.location] ?? payload.location)
    : "";

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

      {payload && (
        <div className="mb-6">
          <div className="mb-4">
            <strong>{t("Customer:")}</strong>
            <br />
            {payload.customer.firstName} {payload.customer.lastName}
            <br />
            {payload.customer.phone}
            {payload.customer.email ? (
              <>
                <br />
                {payload.customer.email}
              </>
            ) : null}
            {payload.location ? (
              <>
                <br />
                <br />
                <strong>{t("Location:")}</strong> {locationLabel}
              </>
            ) : null}
          </div>
          <div className="mb-4">
            <strong>{t("Order Items:")}</strong>
            {payload.items.map((item, i) => (
              <div
                key={i}
                className="py-3 border-b border-bakery-border last:border-b-0"
              >
                {item.breadName} × {item.quantity} = {item.total} {t("RSD")}
              </div>
            ))}
          </div>
          <div className="text-xl font-semibold text-right pt-4 border-t-2 border-bakery-border">
            {t("Total:")} {payload.totalPrice} {t("RSD")}
          </div>
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
              disabled={!payload || isPending}
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
