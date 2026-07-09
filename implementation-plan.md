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

- [x] Backend exposes a `/health` endpoint that confirms DB connectivity (implemented alongside the Prisma setup)

Everything else originally in this phase (Dockerfiles, Railway project setup) has been moved to Phase 14, where the actual deployment happens — no value in setting up Docker/Railway now when local dev works fine against native Postgres and nothing else depends on it yet.

## Phase 3 — Database Schema

- [x] Prisma init, connect to Postgres (local, via a native Postgres install rather than Docker Compose since Docker isn't available on this machine — `bakery` role/database created manually, `/health` confirms live connectivity; Railway connection still pending)
- [x] Define `Article` model (`capacityPerCycle` nullable, `available`, pricing)
- [x] Define `Cycle` model (`label` as ISO week key, `status`: OPEN/CLOSED/COMPLETED, `orderWindowOpensAt`, `orderWindowClosesAt`, `deliveryDate`, `holidayMessage`)
- [x] Partial unique index/constraint: at most one `Cycle` with `status = OPEN` (hand-added to the migration SQL, since Prisma's schema language has no syntax for partial indexes — verified it actually rejects a second OPEN cycle)
- [x] Define `Order` model (recipient, phone, location, items, totalPrice, status, remark, `cycleId`, nullable `repeatingOrderId` — dropped the separate `date` field from the old schema since `createdAt` already covers it) — plus a normalized `OrderItem` table (article + quantity + a snapshotted `unitPrice`) instead of the old denormalized "raw articles string"
- [x] Define `RepeatingOrder` model (recipient, phone, email, location, remark) with its own `RepeatingOrderItem` table
- [x] Wire in Better Auth's required tables via the Prisma adapter (`User`, `Session`, `Account`, `Verification` — generated via `@better-auth/cli generate` against a minimal `src/lib/auth.ts`, not hand-typed)
- [x] Write initial migration
- [x] Seed script: all 46 real articles from the old Google Sheet (the `CONFIG` row was excluded — that was the old sheet's hack for storing the global `acceptingOrders` flag, which `Cycle.status` replaces), 1 open cycle, 3 test orders with items — wired up via `prisma.config.ts`'s `migrations.seed` and runnable with `npm run prisma:seed -w @bakery/backend`

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

## Phase 14 — Deployment & Cutover

### Preparing for production

Start with a simple command: `prepare this app for deployment to Railway`. This should produce Dockerfiles for `apps/backend`, `apps/admin-panel`, and `apps/order-form`, plus any small code adjustments needed (e.g. reading `PORT` from the environment).

- [ ] Ask for the app to be prepared for Railway deployment (Dockerfiles + any entrypoint adjustments)
- [ ] Add a PostgreSQL database in Railway and link it to the backend service
- [ ] Set required env vars (see the Railway section below for the exact list)
- [ ] After the first deploy, seed the database

### Dockerizing the app (local test first)

Before pushing anything to Railway, simulate it locally:

- [ ] Check Docker is installed: `docker --version` — install it if missing
- [ ] Ask to "build a docker image and run it locally" — this builds the same image Railway will build, so problems show up on your machine first, not in production
- [ ] Confirm it actually serves the app on whatever local port it maps to

### Deploying to Railway

Go to railway.com (open in an incognito window if you hit a redirect problem):

- [ ] Add a PostgreSQL database service
- [ ] Connect the `bakery-mono` GitHub repo
- [ ] Go to the backend service's **Variables** tab and set (matching `apps/backend/.env`):
  - `DATABASE_URL` — from the Postgres service Railway just created
  - `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`
  - `BETTER_AUTH_URL` — set once you know the Railway domain (see below)
  - Trusted origins for the admin panel and order form domains (needed since they're separate origins from the backend — see the CORS/cookie note in `CLAUDE.md`)
  - `RESEND_API_KEY` (or SMTP equivalent, per whichever email provider Phase 10 ended up using)
- [ ] Click **Deploy**; if a service shows "Unexposed", click it, then **Generate Domain**, and set the port your app actually listens on (check the app's `PORT` env var / Dockerfile `EXPOSE`)
- [ ] Once you have the real Railway domain, go back to Variables and update `BETTER_AUTH_URL` and the trusted-origins var with the actual `https://...` domain, then redeploy

### Seeding production

- [ ] Install the Railway CLI: `brew install railway` (see https://docs.railway.com/cli for other platforms)
- [ ] `railway login`
- [ ] `railway link` — select the project, then the **backend** service (not Postgres)
- [ ] Run the seed command from the repo root, e.g. `railway run -- npm run prisma:seed -w @bakery/backend`
- [ ] If you hit a `DatabaseNotReachable`-style error: temporarily switch the backend's `DATABASE_URL` to Postgres's *public* connection string in Railway's Variables tab, redeploy, run the seed command again, then switch `DATABASE_URL` back to the private one and redeploy

### Cutover

- [ ] Run test/fake orders through both the admin panel and order form on the deployed staging app for a trial period
- [ ] Verify emails, PDFs, dashboard numbers, and cycle transitions all behave correctly under real-ish use
- [ ] Get baker sign-off on staging behavior
- [ ] Point production order-form and admin panel domains at the new backend
- [ ] Disable n8n webhooks the same day (hard cutover, no parallel-run period)
- [ ] Wire up the Loopia subdomain for production once confirmed stable
