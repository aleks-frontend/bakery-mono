import { z } from "zod";
import { articleSchema } from "./article.js";
import { cycleSchema } from "./cycle.js";

export const orderStatusSchema = z.enum(["NOT_RECEIVED", "IN_PROGRESS", "DELIVERED"]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const ORDER_PAGE_SIZES = [10, 25, 50] as const;
export type OrderPageSize = (typeof ORDER_PAGE_SIZES)[number];

export const orderItemSchema = z.object({
  id: z.string(),
  articleId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().positive(),
  // Present when the backend joins the Article record (GET/POST/PATCH /api/orders all do).
  article: articleSchema.optional(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderSchema = z.object({
  id: z.string(),
  recipient: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  location: z.string(),
  totalPrice: z.number().int(),
  status: orderStatusSchema,
  remark: z.string().nullable(),
  archived: z.boolean(),
  cycleId: z.string(),
  // Present when the backend joins the Cycle record (GET/POST/PATCH /api/orders all do).
  cycle: cycleSchema.optional(),
  repeatingOrderId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  items: z.array(orderItemSchema).optional(),
});
export type Order = z.infer<typeof orderSchema>;

export const orderItemInputSchema = z.object({
  articleId: z.string().min(1),
  quantity: z.number().int().positive(),
});
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

export const createOrderSchema = z.object({
  recipient: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().nullable().optional(),
  location: z.string().min(1),
  remark: z.string().nullable().optional(),
  cycleId: z.string().min(1),
  items: z.array(orderItemInputSchema).min(1),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
  recipient: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  location: z.string().min(1).optional(),
  remark: z.string().nullable().optional(),
  status: orderStatusSchema.optional(),
  items: z.array(orderItemInputSchema).min(1).optional(),
});
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const createPublicOrderSchema = z.object({
  recipient: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().nullable().optional(),
  location: z.string().min(1),
  remark: z.string().nullable().optional(),
  items: z.array(orderItemInputSchema).min(1),
  repeat: z.boolean().default(false),
});
export type CreatePublicOrderInput = z.infer<typeof createPublicOrderSchema>;

export const orderListQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  cycleId: z.string().optional(),
  // z.coerce.boolean() would use JS's Boolean(str) coercion, where the string
  // "false" is truthy — that misparses an explicit `?archived=false` as true.
  archived: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  hasRemark: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "totalPrice", "recipient"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((v) => (ORDER_PAGE_SIZES as readonly number[]).includes(v), {
      message: `pageSize must be one of ${ORDER_PAGE_SIZES.join(", ")}`,
    })
    .default(25),
  // Bypasses page/pageSize entirely and returns every order matching the
  // other filters — used by "select all" to select everything matching the
  // current filters, not just the current page.
  all: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export const orderListResponseSchema = z.object({
  data: z.array(orderSchema),
  total: z.number().int(),
});
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
