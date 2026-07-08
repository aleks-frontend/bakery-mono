import type { BreadType } from '@/types/orderTypes'

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

export function findBreadById(
  breadTypes: BreadType[],
  breadId: string
): BreadType | undefined {
  return breadTypes.find((b) => b.id === breadId)
}
