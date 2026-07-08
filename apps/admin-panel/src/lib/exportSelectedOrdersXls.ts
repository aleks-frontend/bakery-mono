import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { Order } from "@/types/order";

/**
 * Builds an Excel workbook from selected orders (recipient + totalPrice only) and triggers download.
 */
export function downloadSelectedOrdersXls(orders: Order[]): void {
  const rows = orders.map((order) => ({
    recipient: order.recipient,
    totalPrice: order.totalPrice,
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "orders.xlsx",
  );
}
