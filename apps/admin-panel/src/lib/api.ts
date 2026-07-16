import { APIOrderSchema, Order, OrderStatus } from "@/types/order"
import { mapApiOrderToOrder } from "./orderMapper"
import { QueryClient } from "@tanstack/react-query"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://n8n.aleksthecoder.com/webhook/bread-orders"

export async function fetchOrdersQueryFn(): Promise<Order[]> {
  const response = await fetch(API_BASE_URL)

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!Array.isArray(data)) {
    throw new Error("Invalid API response: expected an array")
  }

  const validatedOrders = data.map((item, index) => {
    try {
      return APIOrderSchema.parse(item)
    } catch (error) {
      throw new Error(`Invalid order at index ${index}: ${error}`)
    }
  })

  return validatedOrders.map(mapApiOrderToOrder)
}

export async function fetchOrders(queryClient: QueryClient): Promise<Order[]> {
  return queryClient.fetchQuery({
    queryKey: ["orders"],
    queryFn: fetchOrdersQueryFn,
    staleTime: 30000,
  })
}

// --- Status update ---

export type StatusUpdate = { orderId: string; status: OrderStatus }

export async function updateOrdersStatusBatch(updates: StatusUpdate[]): Promise<void> {
  const url = import.meta.env.VITE_UPDATE_STATUS_URL
  if (!url) throw new Error("VITE_UPDATE_STATUS_URL is not configured")

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data.success) {
    throw new Error((data as { error?: string }).error ?? `Failed to update status: ${response.status}`)
  }
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
  return updateOrdersStatusBatch([{ orderId, status: newStatus }])
}

// --- Manual order creation ---

export type ManualOrderItem = {
  breadId: string
  breadName: string
  quantity: number
  unitPrice: number
}

export type ManualOrderPayload = {
  customer: { firstName: string; lastName: string; phone: string; email: string }
  items: ManualOrderItem[]
  totalPrice: number
  location: string
  remark?: string
}

export async function createManualOrder(payload: ManualOrderPayload): Promise<{ orderId: string }> {
  const url = import.meta.env.VITE_ADMIN_ORDER_URL
  if (!url) throw new Error("VITE_ADMIN_ORDER_URL is not configured")

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !(data as { success?: boolean }).success) {
    throw new Error(
      (data as { message?: string }).message ?? `Failed to create order: ${response.status}`
    )
  }

  return { orderId: (data as { orderId: string }).orderId }
}

// --- Order archival ---

export async function archiveOrders(orderIds: string[]): Promise<void> {
  const url = import.meta.env.VITE_ARCHIVE_ORDER_URL
  if (!url) throw new Error("VITE_ARCHIVE_ORDER_URL is not configured")

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderIds }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !(data as { success?: boolean }).success) {
    throw new Error(
      (data as { error?: string }).error ?? `Failed to archive orders: ${response.status}`
    )
  }
}

// --- Order deletion ---

export async function deleteOrders(orderIds: string[]): Promise<void> {
  const url = import.meta.env.VITE_DELETE_ORDER_URL
  if (!url) throw new Error("VITE_DELETE_ORDER_URL is not configured")

  const response = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderIds }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !(data as { success?: boolean }).success) {
    throw new Error(
      (data as { error?: string }).error ?? `Failed to delete orders: ${response.status}`
    )
  }
}
