import { useRepeatingOrdersQuery as useRepeatingOrdersQueryBase } from "@bakery/api-client"
import { repeatingOrdersClient } from "@/lib/apiClient"

export function useRepeatingOrdersQuery() {
  return useRepeatingOrdersQueryBase(repeatingOrdersClient)
}
