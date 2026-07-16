import { useOrdersQuery as useOrdersQueryBase } from "@bakery/api-client"
import type { OrdersListParams } from "@bakery/api-client"
import { ordersClient } from "@/lib/apiClient"

export function useOrdersQuery(params?: OrdersListParams) {
  return useOrdersQueryBase(ordersClient, params)
}
