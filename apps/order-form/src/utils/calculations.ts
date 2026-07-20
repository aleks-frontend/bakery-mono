import type { PublicArticle } from '@bakery/api-client'

export function getItemTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity
}

export function getTotalPrice(
  items: Array<{ unitPrice: number; quantity: number }>
): number {
  return items.reduce(
    (sum, item) => sum + getItemTotal(item.unitPrice, item.quantity),
    0
  )
}

export function findArticleById(
  articles: PublicArticle[],
  articleId: string
): PublicArticle | undefined {
  return articles.find((a) => a.id === articleId)
}
