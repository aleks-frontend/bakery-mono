import { Router } from "express";
import type { Prisma as PrismaTypes } from "../generated/prisma/client.js";
import { createRepeatingOrderSchema, updateRepeatingOrderSchema } from "@bakery/schemas";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const repeatingOrdersRouter = Router();

repeatingOrdersRouter.use(requireAuth);

const repeatingOrderInclude = {
  items: { include: { article: true } },
} satisfies PrismaTypes.RepeatingOrderInclude;

async function findMissingArticleIds(articleIds: string[]): Promise<string[]> {
  const found = await prisma.article.findMany({ where: { id: { in: articleIds } } });
  const foundIds = new Set(found.map((article) => article.id));
  return articleIds.filter((id) => !foundIds.has(id));
}

repeatingOrdersRouter.get("/", async (_req, res) => {
  const repeatingOrders = await prisma.repeatingOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: repeatingOrderInclude,
  });
  res.json(repeatingOrders);
});

repeatingOrdersRouter.get("/:id", async (req, res) => {
  const repeatingOrder = await prisma.repeatingOrder.findUnique({
    where: { id: req.params.id },
    include: repeatingOrderInclude,
  });
  if (!repeatingOrder) {
    res.status(404).json({ error: "Repeating order not found" });
    return;
  }
  res.json(repeatingOrder);
});

repeatingOrdersRouter.post("/", async (req, res) => {
  const parsed = createRepeatingOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { items, ...fields } = parsed.data;

  const missing = await findMissingArticleIds([...new Set(items.map((item) => item.articleId))]);
  if (missing.length > 0) {
    res.status(400).json({ error: "Unknown article ids", details: missing });
    return;
  }

  const repeatingOrder = await prisma.repeatingOrder.create({
    data: { ...fields, items: { create: items } },
    include: repeatingOrderInclude,
  });
  res.status(201).json(repeatingOrder);
});

repeatingOrdersRouter.patch("/:id", async (req, res) => {
  const parsed = updateRepeatingOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { items, ...fields } = parsed.data;

  if (items) {
    const missing = await findMissingArticleIds([...new Set(items.map((item) => item.articleId))]);
    if (missing.length > 0) {
      res.status(400).json({ error: "Unknown article ids", details: missing });
      return;
    }
  }

  try {
    const repeatingOrder = await prisma.repeatingOrder.update({
      where: { id: req.params.id },
      data: { ...fields, ...(items ? { items: { deleteMany: {}, create: items } } : {}) },
      include: repeatingOrderInclude,
    });
    res.json(repeatingOrder);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Repeating order not found" });
      return;
    }
    throw error;
  }
});

repeatingOrdersRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.repeatingOrder.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Repeating order not found" });
      return;
    }
    throw error;
  }
});
