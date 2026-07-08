import { useQuery } from "@tanstack/react-query"
import { fetchOrdersQueryFn } from "@/lib/api"
import { Order } from "@/types/order"

export function useOrdersQuery() {
  return useQuery<Order[], Error>({
    queryKey: ["orders"],
    queryFn: fetchOrdersQueryFn,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  })
}
