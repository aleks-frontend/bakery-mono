import { useOrderQuery as useOrderQueryBase } from "@bakery/api-client"
import { ordersClient } from "@/lib/apiClient"

export function useOrderQuery(id: string | undefined) {
  return useOrderQueryBase(ordersClient, id)
}
