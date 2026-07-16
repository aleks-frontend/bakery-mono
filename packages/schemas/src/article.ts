import { z } from "zod";

export const articleSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().int().positive(),
  available: z.boolean(),
  capacityPerCycle: z.number().int().positive().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Article = z.infer<typeof articleSchema>;

export const articleWithAvailabilitySchema = articleSchema.extend({
  availableNow: z.boolean(),
});
export type ArticleWithAvailability = z.infer<typeof articleWithAvailabilitySchema>;

export const createArticleSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().positive(),
  available: z.boolean().default(true),
  capacityPerCycle: z.number().int().positive().nullable().optional(),
});
export type CreateArticleInput = z.infer<typeof createArticleSchema>;

export const updateArticleSchema = createArticleSchema.partial();
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

export const publicArticleSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().int().positive(),
  available: z.boolean(),
});
export type PublicArticle = z.infer<typeof publicArticleSchema>;

export const publicArticlesResponseSchema = z.object({
  articles: z.array(publicArticleSchema),
  acceptingOrders: z.boolean(),
  reopenDate: z.coerce.date().nullable(),
  holidayMessage: z.string().nullable(),
});
export type PublicArticlesResponse = z.infer<typeof publicArticlesResponseSchema>;
