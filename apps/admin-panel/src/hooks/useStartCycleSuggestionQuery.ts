import { useStartCycleSuggestionQuery as useStartCycleSuggestionQueryBase } from "@bakery/api-client"
import { cyclesClient } from "@/lib/apiClient"

export function useStartCycleSuggestionQuery(enabled: boolean) {
  return useStartCycleSuggestionQueryBase(cyclesClient, enabled)
}
