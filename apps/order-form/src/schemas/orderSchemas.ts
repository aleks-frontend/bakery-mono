import { z } from 'zod'

export const orderFormItemSchema = z.object({
  articleId: z.string().min(1),
  quantity: z.number().int().min(1),
})

export const orderFormSchema = z.object({
  recipient: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional().or(z.literal('')),
  location: z.string().min(1),
  remark: z.string().optional().or(z.literal('')),
  items: z.array(orderFormItemSchema),
  repeat: z.boolean(),
})

export type OrderFormValues = z.infer<typeof orderFormSchema>
