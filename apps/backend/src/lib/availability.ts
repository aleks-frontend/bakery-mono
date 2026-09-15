import { prisma } from "./prisma.js";

export function getCurrentCycle() {
  return prisma.cycle.findFirst({ where: { status: "OPEN" } });
}

export async function getOrderedQuantitiesByArticle(
  cycleId: string,
  excludeOrderId?: string,
): Promise<Map<string, number>> {
  const grouped = await prisma.orderItem.groupBy({
    by: ["articleId"],
    where: {
      order: { cycleId, ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}) },
    },
    _sum: { quantity: true },
  });

  return new Map(grouped.map((row) => [row.articleId, row._sum.quantity ?? 0]));
}

export function computeAvailability(
  article: { available: boolean; capacityPerCycle: number | null },
  orderedQty: number,
): boolean {
  return article.available && (article.capacityPerCycle == null || orderedQty < article.capacityPerCycle);
}

// Below this many remaining units, the public order form shows a "Limited
// availability" hint. Deliberately not configurable per-article yet — the
// baker hasn't asked for that, and the exact count is never exposed to
// customers, only this boolean.
export const LOW_STOCK_THRESHOLD = 5;

export function computeLowStock(
  article: { available: boolean; capacityPerCycle: number | null },
  orderedQty: number,
): boolean {
  if (article.capacityPerCycle == null) return false;
  if (!computeAvailability(article, orderedQty)) return false;
  return article.capacityPerCycle - orderedQty <= LOW_STOCK_THRESHOLD;
}
