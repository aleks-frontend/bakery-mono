import type { OrderWithRelations } from "./email.js";

const TELEGRAM_API_BASE = "https://api.telegram.org";
const ADMIN_PANEL_URL = "https://admin-panel.lisztrapszodia.in.rs";

function formatMoney(amount: number): string {
  return `${amount.toLocaleString("sr-Latn-RS")} RSD`;
}

// Mirrors the wording/structure of the old n8n workflow's Telegram message as
// closely as possible (same emoji, same *bold*/[link]() legacy Markdown
// style), swapping the Google Sheet link for the admin panel.
function buildMessage(order: OrderWithRelations): string {
  const date = order.createdAt.toLocaleDateString("sr-Latn-RS");
  const articleLines = order.items.map((item) => `• ${item.article.name} x${item.quantity}`).join("\n");

  return [
    "🛒 *Nova porudžbina je primljena!*",
    "",
    "📊 *Nova porudžbina je dodata u sistem.*",
    // HashRouter: "/" is the orders list, ?orderId= opens that order's
    // details modal directly (see OrdersPage's useSearchParams wiring).
    `👉 [Otvori porudžbinu](${ADMIN_PANEL_URL}/#/?orderId=${order.id})`,
    "",
    `👤 Naručilac: *${order.recipient}*`,
    `📞 Telefon: ${order.phone}`,
    `📅 Datum: ${date}`,
    `📍 Lokacija preuzimanja: ${order.location}`,
    "",
    // Emphasized on its own so it can't be missed scrolling past the rest —
    // a baker-specific instruction/allergy/substitution note is the one
    // field that actually changes what gets baked.
    ...(order.remark ? ["⚠️ *NAPOMENA: " + order.remark + "*", ""] : []),
    "📦 *Naručeni artikli:*",
    articleLines,
    "",
    `💰 Ukupna cena: *${formatMoney(order.totalPrice)}*`,
    "",
    "⏳ Molimo proverite detalje i pripremite porudžbinu na vreme.",
  ].join("\n");
}

export async function sendTelegramNotification(order: OrderWithRelations): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("[telegram] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set — skipping notification");
    return;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: buildMessage(order), parse_mode: "Markdown" }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[telegram] notification failed", response.status, body);
    }
  } catch (error) {
    console.error("[telegram] notification failed", error);
  }
}
