import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { computeAvailability, getCurrentCycle, getOrderedQuantitiesByArticle } from "../lib/availability.js";

export const publicRouter = Router();

publicRouter.get("/articles", async (_req, res) => {
  const [articles, currentCycle] = await Promise.all([
    prisma.article.findMany({ orderBy: { name: "asc" } }),
    getCurrentCycle(),
  ]);

  const orderedQty = currentCycle
    ? await getOrderedQuantitiesByArticle(currentCycle.id)
    : new Map<string, number>();

  const latestCycle = currentCycle ?? (await prisma.cycle.findFirst({ orderBy: { createdAt: "desc" } }));

  res.json({
    articles: articles.map((article) => ({
      id: article.id,
      name: article.name,
      price: article.price,
      available: computeAvailability(article, orderedQty.get(article.id) ?? 0),
    })),
    acceptingOrders: currentCycle != null,
    reopenDate: null,
    holidayMessage: currentCycle ? null : (latestCycle?.holidayMessage ?? null),
  });
});
