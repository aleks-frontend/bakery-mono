import { Router } from "express";
import { startCycleSchema, closeCycleSchema, resolveCloneFailureSchema } from "@bakery/schemas";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { suggestNextCycleStartDate, suggestCycleStart } from "../lib/cycleDates.js";
import { cloneRepeatingOrdersIntoCycle } from "../lib/cloneRepeatingOrders.js";
import { repeatingOrderInclude } from "./repeatingOrders.js";

export const cyclesRouter = Router();

cyclesRouter.use(requireAuth);

cyclesRouter.get("/current", async (_req, res) => {
  const cycle = await prisma.cycle.findFirst({ where: { status: "OPEN" } });
  res.json(cycle);
});

cyclesRouter.get("/", async (_req, res) => {
  const cycles = await prisma.cycle.findMany({
    orderBy: { deliveryDate: "desc" },
    include: { _count: { select: { cloneFailures: { where: { resolvedAt: null } } } } },
  });
  res.json(
    cycles.map(({ _count, ...cycle }) => ({ ...cycle, pendingCloneFailureCount: _count.cloneFailures })),
  );
});

cyclesRouter.get("/next-cycle-start-suggestion", async (_req, res) => {
  res.json({ nextCycleStartDate: suggestNextCycleStartDate() });
});

cyclesRouter.get("/start-suggestion", async (_req, res) => {
  res.json(suggestCycleStart());
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

  if (parsed.data.deliveryDate <= new Date()) {
    res.status(400).json({ error: "deliveryDate must be in the future" });
    return;
  }

  const { seasonalArticleIds, ...cycleFields } = parsed.data;

  let cycle;
  try {
    cycle = await prisma.cycle.create({ data: cycleFields });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: "A cycle with this label already exists" });
      return;
    }
    throw error;
  }

  // Seasonal articles default to unavailable every cycle — the baker opts
  // specific ones back in when starting the next cycle, rather than an
  // on/off state silently carrying over from the previous one.
  await prisma.article.updateMany({ where: { isSeasonal: true }, data: { available: false } });
  if (seasonalArticleIds.length > 0) {
    await prisma.article.updateMany({
      where: { id: { in: seasonalArticleIds }, isSeasonal: true },
      data: { available: true },
    });
  }

  const repeatingOrdersCloned = await cloneRepeatingOrdersIntoCycle(cycle.id);
  res.status(201).json({ cycle, repeatingOrdersCloned });
});

cyclesRouter.patch("/:id/close", async (req, res) => {
  const parsed = closeCycleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const cycle = await prisma.cycle.update({
      where: { id: req.params.id, status: "OPEN" },
      data: {
        status: "CLOSED",
        nextCycleStartDate: parsed.data.nextCycleStartDate,
        holidayMessageEn: parsed.data.holidayMessageEn ?? null,
        holidayMessageSr: parsed.data.holidayMessageSr ?? null,
        holidayMessageHu: parsed.data.holidayMessageHu ?? null,
      },
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
// Pending (unresolved) RepeatingOrderCloneFailures for a cycle, joined with
// the RepeatingOrder they came from — the admin panel's "Review failed
// repeating orders" modal uses this to pre-fill a manual order per row.
cyclesRouter.get("/:id/clone-failures", async (req, res) => {
  const failures = await prisma.repeatingOrderCloneFailure.findMany({
    where: { cycleId: req.params.id, resolvedAt: null },
    include: { repeatingOrder: { include: repeatingOrderInclude } },
    orderBy: { createdAt: "asc" },
  });
  res.json(failures);
});

// Marks a clone failure resolved once the baker has manually created the
// missing order — the order itself is created via the normal POST /api/orders
// flow (see OrderFormModal), this just links it back to the failure record so
// it drops out of the pending review list.
cyclesRouter.post("/:id/clone-failures/:failureId/resolve", async (req, res) => {
  const parsed = resolveCloneFailureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const failure = await prisma.repeatingOrderCloneFailure.findUnique({ where: { id: req.params.failureId } });
  if (!failure || failure.cycleId !== req.params.id) {
    res.status(404).json({ error: "Clone failure not found" });
    return;
  }
  if (failure.resolvedAt) {
    res.status(409).json({ error: "Clone failure already resolved" });
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order || order.cycleId !== failure.cycleId || order.repeatingOrderId !== failure.repeatingOrderId) {
    res.status(400).json({ error: "Order does not match this cycle and repeating order" });
    return;
  }

  const resolved = await prisma.repeatingOrderCloneFailure.update({
    where: { id: failure.id },
    data: { resolvedAt: new Date(), resolvedOrderId: order.id },
  });
  res.json(resolved);
});

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
