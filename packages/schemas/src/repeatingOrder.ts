import { z } from "zod";
import { orderItemInputSchema } from "./order.js";

export const repeatingOrderItemSchema = z.object({
  id: z.string(),
  articleId: z.string(),
  quantity: z.number().int().positive(),
});
export type RepeatingOrderItem = z.infer<typeof repeatingOrderItemSchema>;

export const repeatingOrderSchema = z.object({
  id: z.string(),
  recipient: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  location: z.string(),
  remark: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  items: z.array(repeatingOrderItemSchema).optional(),
});
export type RepeatingOrder = z.infer<typeof repeatingOrderSchema>;

export const createRepeatingOrderSchema = z.object({
  recipient: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().nullable().optional(),
  location: z.string().min(1),
  remark: z.string().nullable().optional(),
  items: z.array(orderItemInputSchema).min(1),
});
export type CreateRepeatingOrderInput = z.infer<typeof createRepeatingOrderSchema>;

export const updateRepeatingOrderSchema = createRepeatingOrderSchema.partial();
export type UpdateRepeatingOrderInput = z.infer<typeof updateRepeatingOrderSchema>;
