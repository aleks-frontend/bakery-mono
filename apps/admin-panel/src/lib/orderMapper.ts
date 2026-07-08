import { APIOrder, Order } from "@/types/order"
import { parseOrderedArticles } from "./orderParser"

/**
 * Maps API order response to frontend Order model
 * Handles key name transformations and parsing
 */
export function mapApiOrderToOrder(apiOrder: APIOrder): Order {
  return {
    rowNumber: apiOrder.row_number,
    orderId: apiOrder["Order ID"],
    recipient: apiOrder.Recipient,
    phone: (() => {
      const raw = String(apiOrder.Phone ?? "")
      // Spreadsheet error strings (e.g. #ERROR!, #N/A) mean the cell is invalid
      return raw.startsWith("#") ? "" : raw
    })(),
    date: apiOrder.Date,
    location: apiOrder.Location,
    orderedArticlesRaw: apiOrder["Ordered articles"],
    orderedArticlesParsed: parseOrderedArticles(apiOrder["Ordered articles"]),
    totalPrice: apiOrder["Total price"],
    status: apiOrder.Status as Order["status"],
    remark: apiOrder.Remark != null ? String(apiOrder.Remark) : undefined,
  }
}
