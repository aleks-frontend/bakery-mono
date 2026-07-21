import { Router } from "express";
import { createPublicOrderSchema } from "@bakery/schemas";
import { prisma } from "../lib/prisma.js";
import { computeAvailability, getCurrentCycle, getOrderedQuantitiesByArticle } from "../lib/availability.js";
import { priceAndValidateItems } from "../lib/orderPricing.js";
import { sendOrderNotifications } from "../lib/email.js";
import { orderInclude } from "./orders.js";

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

publicRouter.post("/orders", async (req, res) => {
  const parsed = createPublicOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const cycle = await getCurrentCycle();
  if (!cycle) {
    res.status(409).json({ error: "Ordering is currently closed" });
    return;
  }

  const { repeat, items, ...orderFields } = parsed.data;

  const priced = await priceAndValidateItems(cycle.id, items);
  if (!priced.ok) {
    res.status(409).json({ error: "Some items are unavailable", details: priced.errors });
    return;
  }

  const order = await prisma.$transaction(async (tx) => {
    let repeatingOrderId: string | undefined;
    if (repeat) {
      const repeatingOrder = await tx.repeatingOrder.create({
        data: { ...orderFields, items: { create: items } },
      });
      repeatingOrderId = repeatingOrder.id;
    }

    return tx.order.create({
      data: {
        ...orderFields,
        cycleId: cycle.id,
        repeatingOrderId,
        totalPrice: priced.totalPrice,
        items: { create: priced.items },
      },
      include: orderInclude,
    });
  });

  void sendOrderNotifications(order);
  res.status(201).json(order);
});
