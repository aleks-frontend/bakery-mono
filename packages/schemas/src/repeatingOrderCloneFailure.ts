import { z } from "zod";
import { itemValidationErrorSchema } from "./order.js";
import { repeatingOrderSchema } from "./repeatingOrder.js";

// Persisted when cloneRepeatingOrdersIntoCycle skips a RepeatingOrder at
// cycle-start time because one of its items failed availability/capacity
// validation. Surfaced in the admin panel's "Review failed repeating orders"
// modal, always joined with the RepeatingOrder it came from so the baker has
// enough to recreate the order manually.
export const repeatingOrderCloneFailureSchema = z.object({
  id: z.string(),
  cycleId: z.string(),
  repeatingOrderId: z.string(),
  errors: z.array(itemValidationErrorSchema),
  createdAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
  resolvedOrderId: z.string().nullable(),
  repeatingOrder: repeatingOrderSchema,
});
export type RepeatingOrderCloneFailure = z.infer<typeof repeatingOrderCloneFailureSchema>;

export const resolveCloneFailureSchema = z.object({
  orderId: z.string().min(1),
});
export type ResolveCloneFailureInput = z.infer<typeof resolveCloneFailureSchema>;
