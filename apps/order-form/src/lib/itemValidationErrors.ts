import type { ItemValidationError, PublicArticle } from "@bakery/api-client"

type TFunction = (key: string, options?: Record<string, unknown>) => string

// err.details on a 409 from POST /api/public/orders is priced.errors
// (ItemValidationError[]) — narrow it defensively since HttpError.details is
// typed `unknown` end to end.
export function isItemValidationErrors(details: unknown): details is ItemValidationError[] {
  return (
    Array.isArray(details) &&
    details.length > 0 &&
    details.every((d) => d && typeof d === "object" && "articleId" in d && "code" in d)
  )
}

export interface ResolvedItemError {
  articleId: string
  // "clamped": quantity was reduced to what's still available, item stays on the form.
  // "removed": nothing is available at all, item was dropped from the form.
  action: "clamped" | "removed"
  remaining: number
  // Short text for the inline flag on the row itself (no article name — the row already shows it).
  inlineMessage: string
  // Fuller text for the toast, naming the article since the row may no longer be visible.
  toastMessage: string
}

export function resolveItemValidationError(
  t: TFunction,
  error: ItemValidationError,
  articles: PublicArticle[],
): ResolvedItemError {
  const articleName = articles.find((a) => a.id === error.articleId)?.name ?? t("This item")
  const remaining = error.code === "CAPACITY_EXCEEDED" ? Math.max(error.remaining ?? 0, 0) : 0

  if (error.code === "CAPACITY_EXCEEDED" && remaining > 0) {
    return {
      articleId: error.articleId,
      action: "clamped",
      remaining,
      inlineMessage: t("Only {{remaining}} left — quantity updated", { remaining }),
      toastMessage: t("{{article}}: only {{remaining}} left — quantity updated", {
        article: articleName,
        remaining,
      }),
    }
  }

  return {
    articleId: error.articleId,
    action: "removed",
    remaining: 0,
    inlineMessage: t("No longer available"),
    toastMessage: t("{{article}} was removed — no longer available", { article: articleName }),
  }
}
