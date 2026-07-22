import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@bakery/schemas";
import type { HttpClient } from "./http.js";

export interface DashboardClient {
  stats(cycleId?: string): Promise<DashboardStats>;
}

export function createDashboardClient(http: HttpClient): DashboardClient {
  return {
    stats: (cycleId) =>
      http.request<DashboardStats>(`/api/dashboard/stats${cycleId ? `?cycleId=${cycleId}` : ""}`),
  };
}

export const dashboardStatsQueryKey = (cycleId?: string) => ["dashboard", "stats", cycleId ?? null] as const;

export function useDashboardStatsQuery(client: DashboardClient, cycleId?: string) {
  return useQuery({
    queryKey: dashboardStatsQueryKey(cycleId),
    queryFn: () => client.stats(cycleId),
  });
}
