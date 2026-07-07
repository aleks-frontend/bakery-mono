## Problem

I run a bakery and take orders through a public web order form, but I've had real cases where orders got lost or missed because the current setup relies on n8n workflows writing into a Google Sheet, with no real database, no data integrity guarantees, and no reliable single source of truth.

## Solution

Build a single, centralized order management system with a real backend and database instead of n8n workflows writing into a Google Sheet. Orders come from exactly two places — the public order form and manual entry by the admin — and both should land in the same database with proper integrity, so nothing can silently fall through the cracks. This monorepo will combine the existing admin panel, the public order form, and a new Node/Express/Prisma/PostgreSQL backend that replaces the current n8n + Sheets setup.

No delivery is involved — the baker delivers to exactly two fixed pickup locations, and customers pick up there.

## Features MVP

- Order intake from the two existing sources only: public order form submissions and manual order creation by the admin — no other channels. Phone/in-person orders are always entered manually by the admin; there is no separate intake channel for them.
- PostgreSQL + Prisma as the source of truth, replacing Google Sheets (no more lost rows, no more row-shifting bugs on delete/archive)
- Proper authentication with database-backed sessions for the admin panel (replacing open n8n webhook endpoints). A single admin account is sufficient for MVP — no multi-user/role management yet.
- Order list with search, sorting, filtering, and status tracking (Not received / In Progress / Delivered). Admin can edit an existing order's details (e.g. when a customer reports a mistake). No "Cancelled" status — invalid orders are simply deleted, not archived as cancelled.
- Archive and delete workflows for completed/old orders
- Article management (renamed from the current "BreadType"), with per-item availability toggles and pricing
- **Cycle entity** — the bakery operates in weekly ordering windows (opens Saturday, closes Monday, baker preps midweek, delivers Wednesday — this shifts around for holidays):
  - `Cycle { id, label, status, orderWindowOpensAt, orderWindowClosesAt, deliveryDate, holidayMessage? }`
  - `label` is an ISO week key (e.g. `2026-W27`) — unambiguous and sorts cleanly, avoiding a date-like index (e.g. `2026-jul-1`) that could be misread as an actual date
  - `status` is one of `OPEN | CLOSED | COMPLETED`; at most one cycle is `OPEN` at a time
  - All transitions are manual admin actions for now: "Start next cycle", "Close ordering", "Mark delivered" — no scheduler/cron
  - The public order form's `acceptingOrders` flag (and its reopen-date/holiday-message banner) is derived from the current cycle's status instead of a raw Google Sheet boolean
- **Article capacity per cycle** — each Article gets a nullable `capacityPerCycle` (null = unlimited). Availability in the order form = `article.available && (capacityPerCycle == null || currentCycleOrderedQty < capacityPerCycle)`, computed live from the current cycle's order items, so raising the cap mid-cycle immediately reopens ordering. This was a capacity-limit feature the baker has wanted for a while.
- **Repeating orders** — customers who order the same thing every cycle, currently re-entered manually by the baker each time:
  - `RepeatingOrder { id, recipient, phone, email?, location, items[], remark? }`
  - Created either via a checkbox on the public order form at submission time, or via a "Make repeating" action in the admin panel on any existing order (copies that order's details into a new RepeatingOrder without altering the original order)
  - No dedup guard and no `active` flag — kept intentionally simple; admin edits/deletes a RepeatingOrder directly when a customer asks for a change
  - Clicking "Start next cycle" clones every `RepeatingOrder` into the new cycle as a regular order. Repeating orders do **not** bypass an article's per-cycle capacity cap — they compete for capacity the same as any new order.
  - `Order` gains `cycleId` (required) and `repeatingOrderId` (nullable) — the latter links an order back to the RepeatingOrder that spawned it, in either direction
- Order notifications: on order creation, the customer gets a confirmation email if they supplied one (optional field), and the admin/baker gets an email. (Baker also currently gets a Telegram message via n8n — out of scope for the rebuild, email-only for now.)
- Payments are handled entirely outside the system (cash/e-transfer on pickup) — no payment tracking or processing needed.
- PDF export features carried over from the current admin panel: order receipts, workshop/production lists, and package stickers
- Dashboard with an overview of order volume and status breakdown

## Notes

- No historical data migration for MVP — starting clean with a fresh database. Migrating old Google Sheet orders later for richer dashboard history is a possible future nice-to-have, not required now.
- Hosting on Railway; will connect to the baker's subdomain at Loopia once ready for production.

## Feature / Post-MVP

- User management (admin only, multiple accounts/roles)
- pgvector-backed knowledge base for AI features (e.g. natural-language order search, smart bread-quantity suggestions)
