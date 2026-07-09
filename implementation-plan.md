# Implementation Plan

Build order: backend + DB first → auth → admin panel wired up next (so the baker can trust/use the new system early) → notifications/PDF/dashboard → public order form last (most customer-risk-sensitive) → staging validation → hard cutover from n8n.

Existing `bakery-admin-panel` and `bakery-order-form` repos get fresh-copied into `apps/`, not history-merged.

---

## Phase 1 — Project Setup

- [x] Initialize npm workspaces monorepo (`apps/`, `packages/`)
- [x] Fresh-copy `bakery-admin-panel` into `apps/admin-panel`
- [x] Fresh-copy `bakery-order-form` into `apps/order-form`
- [x] Scaffold `apps/backend` (Node + Express + TypeScript)
- [x] Create `packages/schemas` (empty Zod schema package, wired into all three apps via workspace deps)
- [x] Create `packages/api-client` (empty TanStack Query package, wired into both frontends)
- [x] Shared ESLint + Prettier config at repo root; each app extends it
- [x] `docker-compose.yml` for local dev (Postgres container + backend) — written, but untested since Docker isn't installed on this machine; local dev uses a native Postgres install instead for now
- [x] `.env.example` files for each app documenting required env vars

## Phase 2 — Deploy Walking Skeleton

- [ ] Dockerfile for `backend` (multi-stage build)
- [ ] Dockerfiles for `admin-panel` and `order-form` (static build + serve)
- [ ] Create Railway project with 3 services + Postgres addon
- [x] Backend exposes a `/health` endpoint that confirms DB connectivity (implemented alongside the Prisma setup, ahead of the rest of this phase)
- [ ] Confirm all three services build and deploy on Railway from the monorepo
- [ ] Confirm env vars / secrets flow correctly from Railway into each service
- [ ] Document the deploy process (even briefly) so it's repeatable

## Phase 3 — Database Schema

- [x] Prisma init, connect to Postgres (local, via a native Postgres install rather than Docker Compose since Docker isn't available on this machine — `bakery` role/database created manually, `/health` confirms live connectivity; Railway connection still pending)
- [ ] Define `Article` model (`capacityPerCycle` nullable, `available`, pricing)
- [ ] Define `Cycle` model (`label` as ISO week key, `status`: OPEN/CLOSED/COMPLETED, `orderWindowOpensAt`, `orderWindowClosesAt`, `deliveryDate`, `holidayMessage`)
- [ ] Partial unique index/constraint: at most one `Cycle` with `status = OPEN`
- [ ] Define `Order` model (recipient, phone, date, location, items, totalPrice, status, remark, `cycleId`, nullable `repeatingOrderId`)
- [ ] Define `RepeatingOrder` model (recipient, phone, email, location, items, remark)
- [ ] Wire in Better Auth's required tables via the Prisma adapter (`User`, `Session`, etc.)
- [ ] Write initial migration
- [ ] Seed script: sample articles, one open cycle, a few test orders

## Phase 4 — Authentication

- [ ] Configure Better Auth with `prismaAdapter` (postgresql provider)
- [ ] Mount `toNodeHandler(auth)` at `/api/auth/*` in Express
- [ ] Create the single admin account (seed or one-off script)
- [ ] Admin panel: login page + session handling via `packages/api-client`
- [ ] Express middleware protecting all non-auth, non-public routes
- [ ] Confirm logout + session expiry behavior

## Phase 5 — Core Backend API: Articles

- [ ] CRUD endpoints for Article (create/update/delete/list)
- [ ] Availability computation: `available && (capacityPerCycle == null || currentCycleOrderedQty < capacityPerCycle)`
- [ ] Endpoint for the public order form: articles + `acceptingOrders` (derived from current cycle status) + reopen date/holiday message
- [ ] Zod request/response schemas in `packages/schemas`

## Phase 6 — Core Backend API: Cycles

- [ ] Endpoints: get current cycle, list cycle history
- [ ] Admin action: "Start next cycle" (pre-fills suggested next open/close/delivery dates, editable before confirm)
- [ ] Admin action: "Close ordering"
- [ ] Admin action: "Mark delivered" (→ COMPLETED)
- [ ] Enforce single-OPEN-cycle invariant at the API level
- [ ] "Start next cycle" triggers RepeatingOrder cloning (ties into Phase 8)

## Phase 7 — Core Backend API: Orders

- [ ] CRUD endpoints for Order (create, update/edit, delete)
- [ ] List endpoint with search, sort, filter, and status support (Not received / In Progress / Delivered)
- [ ] Archive workflow (distinct from delete)
- [ ] Manual order creation endpoint (admin path, no cycle-open requirement beyond normal validation)
- [ ] Validate order items against current cycle's article availability/capacity at creation time

## Phase 8 — Core Backend API: Repeating Orders

- [ ] CRUD endpoints for RepeatingOrder
- [ ] "Make repeating" endpoint: creates a RepeatingOrder from an existing Order, links `order.repeatingOrderId`
- [ ] Clone-on-cycle-start logic: for every RepeatingOrder, create a new Order in the new cycle (subject to capacity, no bypass), linked via `repeatingOrderId`
- [ ] Order-form submission accepts a `repeat` flag that also creates a RepeatingOrder

## Phase 9 — Admin Panel Integration

- [ ] Replace n8n/Sheets calls with `packages/api-client` hooks throughout
- [ ] Order list: search/sort/filter/status, backed by the new list endpoint
- [ ] Order edit UI (admin correcting a customer-reported mistake)
- [ ] Archive/delete UI
- [ ] Article management UI (CRUD, availability toggle, capacity field)
- [ ] Cycle control panel: current cycle status, "Start next cycle" / "Close ordering" / "Mark delivered" buttons
- [ ] Repeating orders admin list + edit/delete + "Make repeating" action on an order row
- [ ] Manual order entry form (phone/in-person orders)

## Phase 10 — Notifications

- [ ] Pick and configure email provider (Resend, or Nodemailer/SMTP if reusing an existing mailbox)
- [ ] Customer confirmation email on order creation (only if email supplied)
- [ ] Admin new-order alert email
- [ ] Basic error handling/logging for failed sends (shouldn't block order creation)

## Phase 11 — PDF Exports

- [ ] Order receipt PDF (adapt existing `@react-pdf/renderer` template to new data model)
- [ ] Workshop/production list PDF
- [ ] Package sticker PDF
- [ ] Wire export actions into the admin panel order list/detail views

## Phase 12 — Dashboard

- [ ] Order volume overview (current cycle + historical)
- [ ] Status breakdown (Not received / In Progress / Delivered)
- [ ] Basic date-range or per-cycle filtering

## Phase 13 — Order Form Integration

- [ ] Replace n8n webhook calls with `packages/api-client` hooks
- [ ] Drive `OrderStatusBanner` (`acceptingOrders`, `reopenDate`, `holidayMessage`) from real cycle data
- [ ] Article availability reflects live capacity, not just the static `available` flag
- [ ] Add "repeat this order" checkbox to the form, wired to the `repeat` flag
- [ ] Order confirmation UX after submission

## Phase 14 — Staging Validation & Cutover

- [ ] Deploy full app (all 3 services) to a staging environment on Railway
- [ ] Run test/fake orders through both the admin panel and order form for a trial period
- [ ] Verify emails, PDFs, dashboard numbers, and cycle transitions all behave correctly under real-ish use
- [ ] Get baker sign-off on staging behavior
- [ ] Point production order-form and admin panel domains at the new backend
- [ ] Disable n8n webhooks the same day (hard cutover, no parallel-run period)
- [ ] Wire up Loopia subdomain for production once confirmed stable
