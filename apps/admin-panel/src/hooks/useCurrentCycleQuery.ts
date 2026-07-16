import { useCurrentCycleQuery as useCurrentCycleQueryBase } from "@bakery/api-client"
import { cyclesClient } from "@/lib/apiClient"

export function useCurrentCycleQuery() {
  return useCurrentCycleQueryBase(cyclesClient)
}
