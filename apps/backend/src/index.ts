import "dotenv/config";
import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth, trustedOrigins } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";
import { articlesRouter } from "./routes/articles.js";
import { publicRouter } from "./routes/public.js";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: trustedOrigins,
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "bakery-backend" });
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.use("/api/articles", articlesRouter);
app.use("/api/public", publicRouter);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
