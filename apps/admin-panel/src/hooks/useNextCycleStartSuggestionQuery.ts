import { useNextCycleStartSuggestionQuery as useNextCycleStartSuggestionQueryBase } from "@bakery/api-client"
import { cyclesClient } from "@/lib/apiClient"

export function useNextCycleStartSuggestionQuery(enabled: boolean) {
  return useNextCycleStartSuggestionQueryBase(cyclesClient, enabled)
}
