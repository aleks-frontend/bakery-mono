import { z } from "zod";

export const cycleStatusSchema = z.enum(["OPEN", "CLOSED", "COMPLETED"]);
export type CycleStatus = z.infer<typeof cycleStatusSchema>;

export const cycleSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: cycleStatusSchema,
  deliveryDate: z.coerce.date(),
  nextCycleStartDate: z.coerce.date().nullable(),
  holidayMessageEn: z.string().nullable(),
  holidayMessageSr: z.string().nullable(),
  holidayMessageHu: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Cycle = z.infer<typeof cycleSchema>;

export const startCycleSchema = z.object({
  label: z.string().min(1),
  deliveryDate: z.coerce.date(),
});
export type StartCycleInput = z.infer<typeof startCycleSchema>;

export const closeCycleSchema = z.object({
  nextCycleStartDate: z.coerce.date(),
  holidayMessageEn: z.string().nullable().optional(),
  holidayMessageSr: z.string().nullable().optional(),
  holidayMessageHu: z.string().nullable().optional(),
});
export type CloseCycleInput = z.infer<typeof closeCycleSchema>;

export const nextCycleStartSuggestionSchema = z.object({
  nextCycleStartDate: z.coerce.date(),
});
export type NextCycleStartSuggestion = z.infer<typeof nextCycleStartSuggestionSchema>;

export const cycleStartSuggestionSchema = z.object({
  label: z.string(),
  deliveryDate: z.coerce.date(),
});
export type CycleStartSuggestion = z.infer<typeof cycleStartSuggestionSchema>;
