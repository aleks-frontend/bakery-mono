import type { ItemValidationError } from "@bakery/api-client"

type TFunction = (key: string, options?: Record<string, unknown>) => string

export function describeItemValidationError(t: TFunction, error: ItemValidationError): string {
  switch (error.code) {
    case "NOT_FOUND":
      return t("This article no longer exists")
    case "UNAVAILABLE":
      return t("Article is not available")
    case "CAPACITY_EXCEEDED":
      return t("Only {{remaining}} left this cycle", { remaining: error.remaining ?? 0 })
    default:
      return error.code satisfies never
  }
}

// err.details on a 409 from POST/PATCH /api/orders is priced.errors
// (ItemValidationError[]) — narrow it defensively since HttpError.details is
// typed `unknown` end to end.
export function isItemValidationErrors(details: unknown): details is ItemValidationError[] {
  return (
    Array.isArray(details) &&
    details.length > 0 &&
    details.every((d) => d && typeof d === "object" && "articleId" in d && "code" in d)
  )
}
