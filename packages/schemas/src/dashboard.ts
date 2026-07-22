import { z } from "zod";
import type { OrderStatus } from "./order.js";

export const dashboardStatsQuerySchema = z.object({
  cycleId: z.string().optional(),
});
export type DashboardStatsQuery = z.infer<typeof dashboardStatsQuerySchema>;

// Not Zod-validated on the way out (matches public.ts's GET /articles precedent of
// not parsing outbound responses) — a plain shared type is enough to keep the
// backend's computed shape and the frontend's consumed shape from drifting apart.
export interface DashboardStats {
  scope: { cycleId: string; cycleLabel: string; isCurrent: boolean };
  orderVolume: {
    current: number;
    byCycle: { cycleId: string; label: string; deliveryDate: Date; count: number }[];
  };
  revenue: {
    current: number;
    averageOrderValue: number;
    byCycle: { cycleId: string; label: string; total: number }[];
  };
  statusBreakdown: Record<OrderStatus, number>;
  topArticles: { articleId: string; name: string; quantity: number }[];
  topArticlesAllTime: { articleId: string; name: string; quantity: number }[];
}
