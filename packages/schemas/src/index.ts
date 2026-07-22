import { z } from "zod";

export const pingSchema = z.object({ ok: z.boolean() });
export type Ping = z.infer<typeof pingSchema>;

export * from "./article.js";
export * from "./cycle.js";
export * from "./dashboard.js";
export * from "./order.js";
export * from "./repeatingOrder.js";
