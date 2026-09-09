import { useCloneFailuresQuery as useCloneFailuresQueryBase } from "@bakery/api-client"
import { cyclesClient } from "@/lib/apiClient"

export function useCloneFailuresQuery(cycleId: string | undefined, enabled: boolean) {
  return useCloneFailuresQueryBase(cyclesClient, cycleId, enabled)
}
