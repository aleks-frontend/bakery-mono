import { Resend } from "resend";
import type { Prisma } from "../generated/prisma/client.js";
import type { OrderLocale } from "@bakery/schemas";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : undefined;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: { include: { article: true } }; cycle: true };
}>;

const DATE_LOCALE: Record<OrderLocale, string> = {
  en: "en-US",
  sr: "sr-Latn-RS",
  hu: "hu-HU",
};

const COPY: Record<
  OrderLocale,
  {
    subject: string;
    heading: string;
    greeting: (name: string) => string;
    thankYou: string;
    received: string;
    orderDetailsHeading: string;
    colItem: string;
    colQty: string;
    colTotal: string;
    totalLabel: string;
    deliveryLabel: string;
    locationLabel: string;
    remarkLabel: string;
    repeatNote: string;
    contactNote: string;
    closing: string;
    signOff: string;
  }
> = {
  en: {
    subject: "Order Confirmation – Liszt Rapszodia",
    heading: "Your Order Confirmation",
    greeting: (name) => `Dear ${name},`,
    thankYou: "Thank you for your order!",
    received: "Your order has been successfully received and is being processed.",
    orderDetailsHeading: "Order Details",
    colItem: "Item",
    colQty: "Qty",
    colTotal: "Total",
    totalLabel: "Total",
    deliveryLabel: "Delivery",
    locationLabel: "Location",
    remarkLabel: "Remark",
    repeatNote: "This order repeats automatically every week — you don't need to resubmit it.",
    contactNote:
      "If anything is unclear or we need more information, we'll contact you at the phone number you provided.",
    closing: "Thank you for trusting us — we're looking forward to preparing fresh products for you.",
    signOff: "Warm regards,",
  },
  sr: {
    subject: "Potvrda porudžbine – Liszt Rapszodia",
    heading: "Vaša porudžbina je potvrđena",
    greeting: (name) => `Poštovani/a ${name},`,
    thankYou: "Hvala vam na porudžbini!",
    received: "Vaša narudžbina je uspešno primljena i u obradi je.",
    orderDetailsHeading: "Detalji porudžbine",
    colItem: "Artikal",
    colQty: "Kom.",
    colTotal: "Ukupno",
    totalLabel: "Ukupan iznos",
    deliveryLabel: "Datum isporuke",
    locationLabel: "Lokacija",
    remarkLabel: "Napomena",
    repeatNote: "Ova porudžbina se automatski ponavlja svake nedelje — ne morate je ponovo slati.",
    contactNote:
      "Ukoliko bude bilo kakvih nejasnoća ili potrebe za dodatnim informacijama, kontaktiraćemo vas na broj telefona koji ste ostavili.",
    closing: "Hvala vam na poverenju i radujemo se što ćemo pripremiti sveže proizvode za vas.",
    signOff: "Srdačan pozdrav,",
  },
  hu: {
    subject: "Rendelés visszaigazolása – Liszt Rapszodia",
    heading: "Rendelése visszaigazolva",
    greeting: (name) => `Kedves ${name}!`,
    thankYou: "Köszönjük a rendelését!",
    received: "Rendelését sikeresen megkaptuk, és jelenleg feldolgozás alatt áll.",
    orderDetailsHeading: "Rendelés részletei",
    colItem: "Termék",
    colQty: "Db",
    colTotal: "Összesen",
    totalLabel: "Végösszeg",
    deliveryLabel: "Kiszállítás",
    locationLabel: "Helyszín",
    remarkLabel: "Megjegyzés",
    repeatNote: "Ez a rendelés minden héten automatikusan megismétlődik — nem kell újra elküldenie.",
    contactNote:
      "Ha bármi nem világos, vagy további információra van szükségünk, a megadott telefonszámon fogjuk Önt keresni.",
    closing: "Köszönjük a bizalmát, örömmel készítjük el Önnek a friss termékeket.",
    signOff: "Üdvözlettel,",
  },
};

function formatNumber(amount: number): string {
  return amount.toLocaleString("sr-Latn-RS");
}

// Brand palette, matching apps/order-form's tailwind.config.js `bakery` colors.
const COLOR = {
  bg: "#fbf3e7",
  card: "#fffefb",
  primary: "#c4703b",
  secondary: "#7c8b6f",
  secondarySoft: "#e9ede4",
  border: "#e6d5be",
  text: "#362617",
  headerText: "#fffefb",
};

const FONT_STACK = "'Work Sans', Arial, sans-serif";

function itemRows(order: OrderWithRelations): string {
  return order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid ${COLOR.border}; text-align: left;">${item.article.name}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid ${COLOR.border}; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid ${COLOR.border}; text-align: right; white-space: nowrap;">${formatNumber(item.unitPrice * item.quantity)} RSD</td>
        </tr>`,
    )
    .join("");
}

function orderDetailsTable(order: OrderWithRelations, t: (typeof COPY)[OrderLocale]): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid ${COLOR.border}; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: ${COLOR.secondarySoft};">
          <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: ${COLOR.text};">${t.colItem}</th>
          <th style="padding: 10px 12px; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: ${COLOR.text};">${t.colQty}</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: ${COLOR.text};">${t.colTotal}</th>
        </tr>
      </thead>
      <tbody>${itemRows(order)}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px; font-weight: 600;">${t.totalLabel}</td>
          <td style="padding: 12px; text-align: right; font-weight: 700; color: ${COLOR.primary}; white-space: nowrap;">${formatNumber(order.totalPrice)} RSD</td>
        </tr>
      </tfoot>
    </table>`;
}

function labelValueRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 4px 0; font-size: 13px; color: ${COLOR.secondary}; white-space: nowrap; vertical-align: top;">${label}</td>
      <td style="padding: 4px 0 4px 12px; font-weight: 600;">${value}</td>
    </tr>`;
}

function buildCustomerConfirmationEmail(
  order: OrderWithRelations,
  locale: OrderLocale,
): { subject: string; html: string } {
  const t = COPY[locale];
  // deliveryDate is a calendar date picked by the admin (see StartCycleModal),
  // stored as UTC midnight — format it against UTC explicitly. Without this,
  // toLocaleDateString falls back to the server process's local timezone,
  // which in production is a container with no TZ set (UTC). That rendered a
  // date picked as e.g. Sep 2 in Belgrade (UTC+2, stored as Sep 1 22:00 UTC)
  // as "Sep 1" in the confirmation email — a day earlier than what was
  // actually picked and shown correctly in the admin panel's own UI.
  const deliveryDate = order.cycle.deliveryDate.toLocaleDateString(DATE_LOCALE[locale], { timeZone: "UTC" });

  const metaRows = [
    labelValueRow(t.deliveryLabel, deliveryDate),
    labelValueRow(t.locationLabel, order.location),
    order.remark ? labelValueRow(t.remarkLabel, order.remark) : "",
  ].join("");

  const repeatNote = order.repeatingOrderId
    ? `<div style="margin: 16px 0; padding: 12px 14px; background: ${COLOR.secondarySoft}; border-radius: 8px; font-size: 13px;">🔁 ${t.repeatNote}</div>`
    : "";

  return {
    subject: t.subject,
    html: `
      <div style="font-family: ${FONT_STACK}; background: ${COLOR.bg}; padding: 24px;">
        <div style="max-width: 480px; margin: 0 auto; background: ${COLOR.card}; border: 1px solid ${COLOR.border}; border-radius: 12px; overflow: hidden;">
          <div style="background: ${COLOR.primary}; padding: 20px 24px;">
            <p style="margin: 0; color: ${COLOR.headerText}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85;">Liszt Rapszodia</p>
            <h1 style="margin: 4px 0 0; color: ${COLOR.headerText}; font-size: 20px; font-weight: 600;">${t.heading}</h1>
          </div>
          <div style="padding: 24px; font-size: 15px; line-height: 1.6; color: ${COLOR.text};">
            <p>${t.greeting(order.recipient)}</p>
            <p>${t.thankYou}</p>
            <p>${t.received}</p>

            <p style="margin: 24px 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${COLOR.secondary};">${t.orderDetailsHeading}</p>
            ${orderDetailsTable(order, t)}

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 4px;">
              ${metaRows}
            </table>

            ${repeatNote}

            <p>${t.contactNote}</p>
            <p>${t.closing}</p>

            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid ${COLOR.border};">
              <p style="margin: 0;">
                ${t.signOff}<br>
                <span style="color: ${COLOR.primary}; font-weight: 600;">🎼 Liszt Rapszodia</span><br>
                📧 <a href="mailto:order@lisztrapszodia.in.rs" style="color: ${COLOR.primary};">order@lisztrapszodia.in.rs</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  };
}

function buildAdminAlertEmail(order: OrderWithRelations): { subject: string; html: string } {
  const t = COPY.en;
  const metaRows = [
    labelValueRow("Recipient", order.recipient),
    labelValueRow("Phone", order.phone),
    labelValueRow("Email", order.email ?? "not supplied"),
    labelValueRow("Location", order.location),
    order.remark ? labelValueRow("Remark", order.remark) : "",
  ].join("");

  return {
    subject: `New order from ${order.recipient}`,
    html: `
      <div style="font-family: ${FONT_STACK}; background: ${COLOR.bg}; padding: 24px;">
        <div style="max-width: 480px; margin: 0 auto; background: ${COLOR.card}; border: 1px solid ${COLOR.border}; border-radius: 12px; overflow: hidden;">
          <div style="background: ${COLOR.secondary}; padding: 20px 24px;">
            <p style="margin: 0; color: ${COLOR.headerText}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85;">Liszt Rapszodia</p>
            <h1 style="margin: 4px 0 0; color: ${COLOR.headerText}; font-size: 20px; font-weight: 600;">New Order Alert</h1>
          </div>
          <div style="padding: 24px; font-size: 15px; line-height: 1.6; color: ${COLOR.text};">
            <p>New order received for ${order.cycle.label}.</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0 20px;">
              ${metaRows}
            </table>

            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${COLOR.secondary};">${t.orderDetailsHeading}</p>
            ${orderDetailsTable(order, t)}
          </div>
        </div>
      </div>
    `,
  };
}

export async function sendOrderNotifications(order: OrderWithRelations, locale: OrderLocale = "en"): Promise<void> {
  if (!resend) {
    console.error("[email] RESEND_API_KEY not set — skipping order notification emails");
    return;
  }

  const sends: Promise<void>[] = [];

  if (order.email) {
    const { subject, html } = buildCustomerConfirmationEmail(order, locale);
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
