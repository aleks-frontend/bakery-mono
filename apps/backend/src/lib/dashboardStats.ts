import type { DashboardStats } from "@bakery/schemas";
import { prisma } from "./prisma.js";
import { getCurrentCycle } from "./availability.js";

const TOP_ARTICLES_LIMIT = 10;

export async function getDashboardStats(requestedCycleId?: string): Promise<DashboardStats | null> {
  const currentCycle = await getCurrentCycle();
  const scopeCycle = requestedCycleId
    ? await prisma.cycle.findUnique({ where: { id: requestedCycleId } })
    : (currentCycle ?? (await prisma.cycle.findFirst({ orderBy: { deliveryDate: "desc" } })));

  if (!scopeCycle) return null;

  const [cycles, groupedByCycle, groupedByArticle, groupedByArticleAllTime] = await Promise.all([
    prisma.cycle.findMany({ orderBy: { deliveryDate: "asc" } }),
    prisma.order.groupBy({ by: ["cycleId"], _count: { _all: true }, _sum: { totalPrice: true } }),
    prisma.orderItem.groupBy({
      by: ["articleId"],
      where: { order: { cycleId: scopeCycle.id } },
      _sum: { quantity: true },
    }),
    prisma.orderItem.groupBy({ by: ["articleId"], _sum: { quantity: true } }),
  ]);

  const countByCycleId = new Map(groupedByCycle.map((row) => [row.cycleId, row._count._all]));
  const totalByCycleId = new Map(groupedByCycle.map((row) => [row.cycleId, row._sum.totalPrice ?? 0]));

  const byCycle = cycles.map((cycle) => ({
    cycleId: cycle.id,
    label: cycle.label,
    deliveryDate: cycle.deliveryDate,
    count: countByCycleId.get(cycle.id) ?? 0,
  }));
  const revenueByCycle = cycles.map((cycle) => ({
    cycleId: cycle.id,
    label: cycle.label,
    total: totalByCycleId.get(cycle.id) ?? 0,
  }));

  const currentCount = countByCycleId.get(scopeCycle.id) ?? 0;
  const currentRevenue = totalByCycleId.get(scopeCycle.id) ?? 0;

  const articleIds = [
    ...new Set([...groupedByArticle, ...groupedByArticleAllTime].map((row) => row.articleId)),
  ];
  const articles = await prisma.article.findMany({ where: { id: { in: articleIds } } });
  const articleNameById = new Map(articles.map((article) => [article.id, article.name]));

  const rankArticles = (rows: typeof groupedByArticle) =>
    rows
      .map((row) => ({
        articleId: row.articleId,
        name: articleNameById.get(row.articleId) ?? row.articleId,
        quantity: row._sum.quantity ?? 0,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, TOP_ARTICLES_LIMIT);

  const topArticles = rankArticles(groupedByArticle);
  const topArticlesAllTime = rankArticles(groupedByArticleAllTime);

  return {
    scope: {
      cycleId: scopeCycle.id,
      cycleLabel: scopeCycle.label,
      isCurrent: currentCycle?.id === scopeCycle.id,
    },
    orderVolume: { current: currentCount, byCycle },
    revenue: {
      current: currentRevenue,
      averageOrderValue: currentCount > 0 ? Math.round(currentRevenue / currentCount) : 0,
      byCycle: revenueByCycle,
    },
    topArticles,
    topArticlesAllTime,
  };
}
