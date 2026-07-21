import { Resend } from "resend";
import type { Prisma } from "../generated/prisma/client.js";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : undefined;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: { include: { article: true } }; cycle: true };
}>;

function formatMoney(amount: number): string {
  return `${amount.toLocaleString("sr-Latn-RS")} RSD`;
}

function formatItemsList(order: OrderWithRelations): string {
  return order.items
    .map((item) => `<li>${item.article.name} × ${item.quantity} — ${formatMoney(item.unitPrice)}</li>`)
    .join("");
}

function buildCustomerConfirmationEmail(order: OrderWithRelations): { subject: string; html: string } {
  const repeatNote = order.repeatingOrderId
    ? "<p>This order repeats automatically every week — you don't need to resubmit it.</p>"
    : "";
  const remarkNote = order.remark ? `<p>Remark: ${order.remark}</p>` : "";

  return {
    subject: "Your order confirmation",
    html: `
      <p>Hi ${order.recipient},</p>
      <p>Thanks for your order! Here's a summary:</p>
      <ul>${formatItemsList(order)}</ul>
      <p>Total: ${formatMoney(order.totalPrice)}</p>
      <p>Delivery: ${order.cycle.label} (${order.cycle.deliveryDate.toDateString()})</p>
      <p>Location: ${order.location}</p>
      ${remarkNote}
      ${repeatNote}
    `,
  };
}

function buildAdminAlertEmail(order: OrderWithRelations): { subject: string; html: string } {
  return {
    subject: `New order from ${order.recipient}`,
    html: `
      <p>New order received for ${order.cycle.label}.</p>
      <p>Recipient: ${order.recipient}</p>
      <p>Phone: ${order.phone}</p>
      <p>Email: ${order.email ?? "not supplied"}</p>
      <p>Location: ${order.location}</p>
      ${order.remark ? `<p>Remark: ${order.remark}</p>` : ""}
      <ul>${formatItemsList(order)}</ul>
      <p>Total: ${formatMoney(order.totalPrice)}</p>
    `,
  };
}

export async function sendOrderNotifications(order: OrderWithRelations): Promise<void> {
  if (!resend) {
    console.error("[email] RESEND_API_KEY not set — skipping order notification emails");
    return;
  }

  const sends: Promise<void>[] = [];

  if (order.email) {
    const { subject, html } = buildCustomerConfirmationEmail(order);
    sends.push(
      resend.emails
        .send({ from: process.env.EMAIL_FROM ?? "", to: [order.email], subject, html })
        .then(({ error }) => {
          if (error) console.error("[email] customer confirmation failed", error);
        })
        .catch((error: unknown) => console.error("[email] customer confirmation failed", error)),
    );
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    const { subject, html } = buildAdminAlertEmail(order);
    sends.push(
      resend.emails
        .send({ from: process.env.EMAIL_FROM ?? "", to: [adminEmail], subject, html })
        .then(({ error }) => {
          if (error) console.error("[email] admin alert failed", error);
        })
        .catch((error: unknown) => console.error("[email] admin alert failed", error)),
    );
  }

  await Promise.allSettled(sends);
}
