import { Router, type Response } from "express";
import type { Prisma as PrismaTypes } from "../generated/prisma/client.js";
import { createOrderSchema, orderListQuerySchema, updateOrderSchema } from "@bakery/schemas";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { priceAndValidateItems } from "../lib/orderPricing.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

const orderInclude = { items: { include: { article: true } } } satisfies PrismaTypes.OrderInclude;

ordersRouter.get("/", async (req, res) => {
  const parsed = orderListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { status, cycleId, archived, search, sortBy, sortDir } = parsed.data;

  const where: PrismaTypes.OrderWhereInput = {
    archived,
    ...(status ? { status } : {}),
    ...(cycleId ? { cycleId } : {}),
    ...(search
      ? {
          OR: [
            { recipient: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { [sortBy]: sortDir },
    include: orderInclude,
  });
  res.json(orders);
});

ordersRouter.get("/:id", async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: orderInclude });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

ordersRouter.post("/", async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { cycleId, items, ...orderFields } = parsed.data;

  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
  if (!cycle) {
    res.status(400).json({ error: "Cycle not found" });
    return;
  }

  const priced = await priceAndValidateItems(cycleId, items);
  if (!priced.ok) {
    res.status(409).json({ error: "Some items are unavailable", details: priced.errors });
    return;
  }

  const order = await prisma.order.create({
    data: {
      ...orderFields,
      cycleId,
      totalPrice: priced.totalPrice,
      items: { create: priced.items },
    },
    include: orderInclude,
  });
  res.status(201).json(order);
});

ordersRouter.patch("/:id", async (req, res) => {
  const parsed = updateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const { items, ...orderFields } = parsed.data;

  if (!items) {
    const order = await prisma.order.update({
      where: { id: existing.id },
      data: orderFields,
      include: orderInclude,
    });
    res.json(order);
    return;
  }

  const priced = await priceAndValidateItems(existing.cycleId, items, existing.id);
  if (!priced.ok) {
    res.status(409).json({ error: "Some items are unavailable", details: priced.errors });
    return;
  }

  const order = await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId: existing.id } });
    return tx.order.update({
      where: { id: existing.id },
      data: { ...orderFields, totalPrice: priced.totalPrice, items: { create: priced.items } },
      include: orderInclude,
    });
  });

  res.json(order);
});

ordersRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    throw error;
  }
});

ordersRouter.patch("/:id/archive", async (req, res) => {
  await updateArchived(req.params.id, true, res);
});

ordersRouter.patch("/:id/unarchive", async (req, res) => {
  await updateArchived(req.params.id, false, res);
});

async function updateArchived(id: string, archived: boolean, res: Response) {
  try {
    const order = await prisma.order.update({ where: { id }, data: { archived }, include: orderInclude });
    res.json(order);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    throw error;
  }
}
