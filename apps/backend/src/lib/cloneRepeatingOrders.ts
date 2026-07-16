import { prisma } from "./prisma.js";
import { priceAndValidateItems, type ItemValidationError } from "./orderPricing.js";
import { orderInclude } from "../routes/orders.js";

export interface CloneResult {
  repeatingOrderId: string;
  orderId?: string;
  errors?: ItemValidationError[];
}

/**
 * Clones every RepeatingOrder into a regular Order in the given (newly
 * started) cycle. Runs sequentially, not in parallel, so each clone's
 * capacity check sees the orders already created by earlier clones in this
 * same run — repeating orders compete for capacity like any other order,
 * with no bypass, so an article can still run out partway through.
 */
export async function cloneRepeatingOrdersIntoCycle(cycleId: string): Promise<CloneResult[]> {
  const repeatingOrders = await prisma.repeatingOrder.findMany({ include: { items: true } });
  const results: CloneResult[] = [];

  for (const repeatingOrder of repeatingOrders) {
    const priced = await priceAndValidateItems(
      cycleId,
      repeatingOrder.items.map((item) => ({ articleId: item.articleId, quantity: item.quantity })),
    );

    if (!priced.ok) {
      results.push({ repeatingOrderId: repeatingOrder.id, errors: priced.errors });
      continue;
    }

    const order = await prisma.order.create({
      data: {
        recipient: repeatingOrder.recipient,
        phone: repeatingOrder.phone,
        email: repeatingOrder.email,
        location: repeatingOrder.location,
        remark: repeatingOrder.remark,
        cycleId,
        repeatingOrderId: repeatingOrder.id,
        totalPrice: priced.totalPrice,
        items: { create: priced.items },
      },
      include: orderInclude,
    });

    results.push({ repeatingOrderId: repeatingOrder.id, orderId: order.id });
  }

  return results;
}
