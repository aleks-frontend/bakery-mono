import { z } from "zod"

// OrderStatus enum
export const OrderStatusSchema = z.enum(["Not received", "In Progress", "Delivered"])
export type OrderStatus = z.infer<typeof OrderStatusSchema>

// ParsedOrderItem schema
export const ParsedOrderItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
})
export type ParsedOrderItem = z.infer<typeof ParsedOrderItemSchema>

// Frontend Order model (camelCase)
export const OrderSchema = z.object({
  rowNumber: z.number(),
  orderId: z.string(),
  recipient: z.string(),
  phone: z.string(),
  date: z.string(),
  location: z.string(),
  orderedArticlesRaw: z.string(),
  orderedArticlesParsed: z.array(ParsedOrderItemSchema),
  totalPrice: z.number(),
  status: OrderStatusSchema,
  remark: z.string().optional(),
})
export type Order = z.infer<typeof OrderSchema>

// API Order model (raw API response shape)
export const APIOrderSchema = z.object({
  row_number: z.number(),
  "Order ID": z.string(),
  Recipient: z.string(),
  Phone: z.union([z.number(), z.string()]),
  Date: z.string(),
  Location: z.string(),
  "Ordered articles": z.string(),
  "Total price": z.number(),
  Status: z.string(),
  Remark: z.union([z.string(), z.number()]).optional(),
})
export type APIOrder = z.infer<typeof APIOrderSchema>
