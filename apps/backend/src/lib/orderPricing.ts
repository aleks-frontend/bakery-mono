import { prisma } from "./prisma.js";
import { computeAvailability, getOrderedQuantitiesByArticle } from "./availability.js";

export interface PricedOrderItem {
  articleId: string;
  quantity: number;
  unitPrice: number;
}

export interface ItemValidationError {
  articleId: string;
  reason: string;
}

export type PriceAndValidateResult =
  | { ok: true; items: PricedOrderItem[]; totalPrice: number }
  | { ok: false; errors: ItemValidationError[] };

/**
 * Prices order items from the current Article record (never trusts a
 * client-supplied price) and rejects any item that exceeds the article's
 * remaining per-cycle capacity. `excludeOrderId` lets an order's own existing
 * items be excluded from the "already ordered" count when re-validating an
 * edit, so shrinking/keeping a quantity doesn't self-block against capacity.
 */
export async function priceAndValidateItems(
  cycleId: string,
  requestedItems: { articleId: string; quantity: number }[],
  excludeOrderId?: string,
): Promise<PriceAndValidateResult> {
  const mergedQuantities = new Map<string, number>();
  for (const item of requestedItems) {
    mergedQuantities.set(item.articleId, (mergedQuantities.get(item.articleId) ?? 0) + item.quantity);
  }

  const articles = await prisma.article.findMany({ where: { id: { in: [...mergedQuantities.keys()] } } });
  const articleById = new Map(articles.map((article) => [article.id, article]));
  const orderedQty = await getOrderedQuantitiesByArticle(cycleId, excludeOrderId);

  const errors: ItemValidationError[] = [];
  const items: PricedOrderItem[] = [];

  for (const [articleId, quantity] of mergedQuantities) {
    const article = articleById.get(articleId);
    if (!article) {
      errors.push({ articleId, reason: "Article not found" });
      continue;
    }

    const alreadyOrdered = orderedQty.get(articleId) ?? 0;
    if (!computeAvailability(article, alreadyOrdered)) {
      errors.push({ articleId, reason: "Article is not available" });
      continue;
    }

    if (article.capacityPerCycle != null) {
      const remaining = article.capacityPerCycle - alreadyOrdered;
      if (quantity > remaining) {
        errors.push({ articleId, reason: `Only ${Math.max(remaining, 0)} remaining this cycle` });
        continue;
      }
    }

    items.push({ articleId, quantity, unitPrice: article.price });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return { ok: true, items, totalPrice };
}
