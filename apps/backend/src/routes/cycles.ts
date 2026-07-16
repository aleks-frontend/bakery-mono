import { Router } from "express";
import { startCycleSchema } from "@bakery/schemas";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { suggestNextCycleDates } from "../lib/cycleDates.js";
import { cloneRepeatingOrdersIntoCycle } from "../lib/cloneRepeatingOrders.js";

export const cyclesRouter = Router();

cyclesRouter.use(requireAuth);

cyclesRouter.get("/current", async (_req, res) => {
  const cycle = await prisma.cycle.findFirst({ where: { status: "OPEN" } });
  res.json(cycle);
});

cyclesRouter.get("/", async (_req, res) => {
  const cycles = await prisma.cycle.findMany({ orderBy: { deliveryDate: "desc" } });
  res.json(cycles);
});

cyclesRouter.get("/next-suggestion", async (_req, res) => {
  const lastCycle = await prisma.cycle.findFirst({ orderBy: { deliveryDate: "desc" } });
  res.json(suggestNextCycleDates(lastCycle));
});

cyclesRouter.post("/", async (req, res) => {
  const parsed = startCycleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const openCycle = await prisma.cycle.findFirst({ where: { status: "OPEN" } });
  if (openCycle) {
    res.status(409).json({ error: "A cycle is already open. Close it before starting a new one." });
    return;
  }

  let cycle;
  try {
    cycle = await prisma.cycle.create({ data: parsed.data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: "A cycle with this label already exists" });
      return;
    }
    throw error;
  }

  const repeatingOrdersCloned = await cloneRepeatingOrdersIntoCycle(cycle.id);
  res.status(201).json({ cycle, repeatingOrdersCloned });
});

cyclesRouter.patch("/:id/close", async (req, res) => {
  try {
    const cycle = await prisma.cycle.update({
      where: { id: req.params.id, status: "OPEN" },
      data: { status: "CLOSED" },
    });
    res.json(cycle);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(409).json({ error: "Cycle not found or not currently open" });
      return;
    }
    throw error;
  }
});

cyclesRouter.patch("/:id/deliver", async (req, res) => {
  try {
    const cycle = await prisma.cycle.update({
      where: { id: req.params.id, status: "CLOSED" },
      data: { status: "COMPLETED" },
    });
    res.json(cycle);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(409).json({ error: "Cycle not found or not currently closed" });
      return;
    }
    throw error;
  }
});
