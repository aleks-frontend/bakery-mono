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
