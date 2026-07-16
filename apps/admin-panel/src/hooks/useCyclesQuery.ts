import { useCyclesQuery as useCyclesQueryBase } from "@bakery/api-client"
import { cyclesClient } from "@/lib/apiClient"

export function useCyclesQuery() {
  return useCyclesQueryBase(cyclesClient)
}
