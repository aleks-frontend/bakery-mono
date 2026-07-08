import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Order } from "@/types/order"
import { StatusBadge } from "./StatusBadge"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "react-i18next"
import { Archive, FileDown, Trash2 } from "lucide-react"
import type { ReceiptPdfLabels } from "@/components/OrderReceiptPdf"

interface OrderDetailsModalProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleteOrder: (order: Order) => void
  onArchiveOrder: (order: Order) => void
}

export function OrderDetailsModal({
  order,
  open,
  onOpenChange,
  onDeleteOrder,
  onArchiveOrder,
}: OrderDetailsModalProps) {
  const { t } = useTranslation()
  const [pdfLoading, setPdfLoading] = useState(false)

  if (!order) return null

  const currentOrder = order

  const receiptLabels: ReceiptPdfLabels = {
    title: t("Receipt"),
    billTo: t("Bill to"),
    recipient: t("Recipient"),
    orderedArticles: t("Ordered Articles"),
    item: t("Item"),
    qty: t("Qty"),
    amount: t("Amount"),
    total: t("Total Price"),
    orderRef: t("Order ID"),
    date: t("Date"),
    phone: t("Phone"),
    location: t("Location"),
    remark: t("Remark"),
    articlesFallback: t("No articles"),
  }

  async function handleDownloadReceiptPdf() {
    setPdfLoading(true)
    try {
      const { downloadOrderReceiptPdf } = await import(
        "@/components/OrderReceiptPdf"
      )
      await downloadOrderReceiptPdf(currentOrder, receiptLabels)
    } catch (err) {
      console.error(err)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-10">
          <DialogTitle>{t("Order Details")}</DialogTitle>
          <DialogDescription>
            {t("Order ID: {{orderId}}", { orderId: currentOrder.orderId })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("Recipient")}
              </p>
              <p className="text-sm">{currentOrder.recipient}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("Phone")}
              </p>
              <p className="text-sm">{currentOrder.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("Date")}
              </p>
              <p className="text-sm">{currentOrder.date}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("Location")}
              </p>
              <p className="text-sm">{currentOrder.location}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("Status")}
              </p>
              <div className="mt-1">
                <StatusBadge status={currentOrder.status} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("Total Price")}
              </p>
              <p className="text-sm font-semibold">{currentOrder.totalPrice} {t("RSD")}</p>
            </div>
          </div>

          {currentOrder.remark && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("Remark")}
                </p>
                <p className="text-sm">{currentOrder.remark}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Ordered Articles */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              {t("Ordered Articles")}
            </p>
            <div className="space-y-2">
              {currentOrder.orderedArticlesParsed.length > 0 ? (
                currentOrder.orderedArticlesParsed.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("Quantity: {{quantity}}", { quantity: item.quantity })}
                      </p>
                    </div>
                    <p className="font-semibold">{item.price} {t("RSD")}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {currentOrder.orderedArticlesRaw || t("No articles")}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 flex w-full flex-col gap-2 border-t pt-4 sm:flex-col sm:space-x-0">
          <Button
            type="button"
            variant="default"
            size="lg"
            disabled={pdfLoading}
            onClick={handleDownloadReceiptPdf}
            className="w-full gap-2.5 font-semibold text-base shadow-md transition-shadow hover:shadow-lg"
          >
            <FileDown className="size-5 shrink-0" aria-hidden />
            {pdfLoading ? t("Generating PDF...") : t("Generate PDF receipt")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => onArchiveOrder(currentOrder)}
            className="w-full gap-2.5 font-semibold text-base"
          >
            <Archive className="size-5 shrink-0" aria-hidden />
            {t("Archive Order")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={() => onDeleteOrder(currentOrder)}
            className="w-full gap-2.5 font-semibold text-base"
          >
            <Trash2 className="size-5 shrink-0" aria-hidden />
            {t("Delete Order")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
