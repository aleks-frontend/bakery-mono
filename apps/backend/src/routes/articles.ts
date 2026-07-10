import { Router } from "express";
import { createArticleSchema, updateArticleSchema } from "@bakery/schemas";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { computeAvailability, getCurrentCycle, getOrderedQuantitiesByArticle } from "../lib/availability.js";
import { isForeignKeyViolation } from "../lib/prismaErrors.js";

export const articlesRouter = Router();

articlesRouter.use(requireAuth);

articlesRouter.get("/", async (_req, res) => {
  const [articles, currentCycle] = await Promise.all([
    prisma.article.findMany({ orderBy: { name: "asc" } }),
    getCurrentCycle(),
  ]);

  const orderedQty = currentCycle
    ? await getOrderedQuantitiesByArticle(currentCycle.id)
    : new Map<string, number>();

  res.json(
    articles.map((article) => ({
      ...article,
      availableNow: computeAvailability(article, orderedQty.get(article.id) ?? 0),
    })),
  );
});

articlesRouter.post("/", async (req, res) => {
  const parsed = createArticleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const article = await prisma.article.create({ data: parsed.data });
  res.status(201).json(article);
});

articlesRouter.patch("/:id", async (req, res) => {
  const parsed = updateArticleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const article = await prisma.article.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(article);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    throw error;
  }
});

articlesRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.article.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    if (isForeignKeyViolation(error)) {
      res.status(409).json({ error: "Article is referenced by existing orders and cannot be deleted" });
      return;
    }
    throw error;
  }
});
