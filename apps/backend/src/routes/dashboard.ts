import { Router } from "express";
import { dashboardStatsQuerySchema } from "@bakery/schemas";
import { requireAuth } from "../middleware/requireAuth.js";
import { getDashboardStats } from "../lib/dashboardStats.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/stats", async (req, res) => {
  const parsed = dashboardStatsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const stats = await getDashboardStats(parsed.data.cycleId);
  if (!stats) {
    res.status(404).json({ error: "No cycles exist yet" });
    return;
  }

  res.json(stats);
});
