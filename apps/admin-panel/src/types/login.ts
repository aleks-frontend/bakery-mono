import { z } from "zod"

export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().min(1, t("Required")).email(t("Invalid email")),
    password: z.string().min(1, t("Required")),
  })
}

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>
