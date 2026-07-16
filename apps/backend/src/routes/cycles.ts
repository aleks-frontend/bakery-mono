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

// Undoes an accidental "Close Ordering" click. Safe by construction: the admin
// panel only ever exposes this on the single most-recent cycle, and nothing
// else keys off the OPEN/CLOSED boundary (repeating-order cloning happens on
// cycle *creation*, not on close), so there's no side effect to unwind.
cyclesRouter.patch("/:id/reopen", async (req, res) => {
  try {
    const cycle = await prisma.cycle.update({
      where: { id: req.params.id, status: "CLOSED" },
      data: { status: "OPEN" },
    });
    res.json(cycle);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(409).json({ error: "Cycle not found or not currently closed" });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: "Another cycle is already open" });
      return;
    }
    throw error;
  }
});

// TODO: reconsider whether COMPLETED should exist as its own status at all.
// Right now "Mark Delivered" (CLOSED -> COMPLETED) has exactly one behavioral
// effect anywhere in the system: it's what the admin panel checks to decide
// whether to show "Start Next Cycle". It doesn't touch Order rows, doesn't
// bulk-update Order.status (a separate, unrelated per-order field that also
// happens to have a "DELIVERED" value — easy to confuse with this), doesn't
// trigger PDFs or emails. A simpler model might drop COMPLETED entirely and
// allow starting the next cycle straight from CLOSED, removing this extra
// manual step. Not doing that now since it's a schema-level decision
// (touches the CycleStatus enum and project-scope.md's domain model), but
// flagging it since the current three-state dance is easy to misread as
// doing more than it does.
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

// Undoes an accidental "Mark Delivered" click, for the same reasons /reopen
// undoes "Close Ordering" — see the TODO above on /deliver.
cyclesRouter.patch("/:id/undo-deliver", async (req, res) => {
  try {
    const cycle = await prisma.cycle.update({
      where: { id: req.params.id, status: "COMPLETED" },
      data: { status: "CLOSED" },
    });
    res.json(cycle);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(409).json({ error: "Cycle not found or not currently completed" });
      return;
    }
    throw error;
  }
});
