import { z } from "zod";

export const cycleStatusSchema = z.enum(["OPEN", "CLOSED", "COMPLETED"]);
export type CycleStatus = z.infer<typeof cycleStatusSchema>;

export const cycleSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: cycleStatusSchema,
  orderWindowOpensAt: z.coerce.date(),
  orderWindowClosesAt: z.coerce.date(),
  deliveryDate: z.coerce.date(),
  holidayMessage: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Cycle = z.infer<typeof cycleSchema>;

export const startCycleSchema = z
  .object({
    label: z.string().min(1),
    orderWindowOpensAt: z.coerce.date(),
    orderWindowClosesAt: z.coerce.date(),
    deliveryDate: z.coerce.date(),
    holidayMessage: z.string().nullable().optional(),
  })
  .refine((data) => data.orderWindowClosesAt > data.orderWindowOpensAt, {
    message: "orderWindowClosesAt must be after orderWindowOpensAt",
    path: ["orderWindowClosesAt"],
  })
  .refine((data) => data.deliveryDate > data.orderWindowClosesAt, {
    message: "deliveryDate must be after orderWindowClosesAt",
    path: ["deliveryDate"],
  });
export type StartCycleInput = z.infer<typeof startCycleSchema>;

export const cycleSuggestionSchema = z.object({
  label: z.string(),
  orderWindowOpensAt: z.coerce.date(),
  orderWindowClosesAt: z.coerce.date(),
  deliveryDate: z.coerce.date(),
});
export type CycleSuggestion = z.infer<typeof cycleSuggestionSchema>;
