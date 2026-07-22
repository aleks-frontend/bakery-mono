import { useDashboardStatsQuery as useDashboardStatsQueryBase } from "@bakery/api-client"
import { dashboardClient } from "@/lib/apiClient"

export function useDashboardStatsQuery(cycleId?: string) {
  return useDashboardStatsQueryBase(dashboardClient, cycleId)
}
