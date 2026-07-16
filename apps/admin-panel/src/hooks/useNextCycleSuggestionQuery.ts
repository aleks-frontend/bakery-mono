import { useNextCycleSuggestionQuery as useNextCycleSuggestionQueryBase } from "@bakery/api-client"
import { cyclesClient } from "@/lib/apiClient"

export function useNextCycleSuggestionQuery(enabled: boolean) {
  return useNextCycleSuggestionQueryBase(cyclesClient, enabled)
}
