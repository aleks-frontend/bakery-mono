import { z } from 'zod'

export const breadTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().min(0),
  available: z.boolean().default(true),
})

export const breadTypesResponseSchema = z.object({
  acceptingOrders: z.boolean(),
  data: z.array(breadTypeSchema),
})

export const customerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional().or(z.literal('')),
})

export const orderItemSchema = z.object({
  breadId: z.string().min(1),
  quantity: z.number().int().min(1),
})

export const orderFormItemSchema = z.object({
  breadId: z.string().min(1),
  quantity: z.number().int().min(1),
})

export const orderFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional().or(z.literal('')),
  location: z.string().min(1),
  remark: z.string().optional().or(z.literal('')),
  items: z.array(orderFormItemSchema),
})

export type OrderFormValues = z.infer<typeof orderFormSchema>

export const orderPayloadSchema = z.object({
  customer: customerSchema,
  items: z.array(
    z.object({
      breadId: z.string(),
      breadName: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      total: z.number(),
    })
  ),
  totalPrice: z.number(),
  submittedAt: z.string(),
  location: z.string(),
  remark: z.string().nullable(),
  language: z.string(),
})

export const orderSubmitResponseSchema = z.object({
  ok: z.boolean().optional(),
}).passthrough()

export type BreadTypeSchema = z.infer<typeof breadTypeSchema>
export type BreadTypesResponseSchema = z.infer<typeof breadTypesResponseSchema>
export type CustomerSchema = z.infer<typeof customerSchema>
export type OrderItemSchema = z.infer<typeof orderItemSchema>
export type OrderPayloadSchema = z.infer<typeof orderPayloadSchema>
export type OrderSubmitResponseSchema = z.infer<typeof orderSubmitResponseSchema>
