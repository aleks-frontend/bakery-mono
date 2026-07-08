import { z } from "zod"

export const BreadTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  available: z.boolean(),
})
export type BreadType = z.infer<typeof BreadTypeSchema>

export const BreadTypesResponseSchema = z.object({
  acceptingOrders: z.boolean(),
  data: z.array(BreadTypeSchema),
})
export type BreadTypesResponse = z.infer<typeof BreadTypesResponseSchema>
