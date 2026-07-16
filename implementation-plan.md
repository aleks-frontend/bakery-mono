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

- [x] Configure Better Auth with `prismaAdapter` (postgresql provider) and database sessions
- [x] Mount `toNodeHandler(auth)` at `/api/auth/*` in Express (Express 5 wildcard syntax: `/api/auth/*splat`)
- [x] Set `TRUSTED_ORIGINS` (admin panel's `localhost:5173` origin, plus its future real domain) — needed now, not just at deploy time, since the admin panel and backend are already different origins in local dev — read from a `TRUSTED_ORIGINS` env var (comma-separated), shared between `cors()` and Better Auth's own origin check, falling back to the local dev origins if unset
- [x] **Explicitly disable public sign-up** — Better Auth's email/password setup exposes a public sign-up endpoint by default; since there's only ever one admin account, this must be locked down or anyone who finds the API could register their own account — done via the built-in `emailAndPassword.disableSignUp: true` option
- [x] Seed script creates the single admin account, reading its email/password from env vars (not hardcoded) — bypasses the disabled `/sign-up/email` route by provisioning directly via `auth.$context`'s `internalAdapter`, the documented pattern for server-side user creation
- [x] `requireAuth` Express middleware: calls `auth.api.getSession` (via `fromNodeHeaders`), rejects with 401 if no session, otherwise attaches `req.user`/`req.session` and calls `next()` — written and verified standalone; not yet mounted on any route since no protected routes exist until Phase 5
- [x] Admin panel: login page (using existing shadcn/ui components already in the repo) + session handling via `packages/api-client` (`createBakeryAuthClient`, built on Better Auth's React client)
- [x] After login: redirect to the order list, show the logged-in user's name in the header, add a sign-out button
- [x] Confirm logout + session expiry behavior — verified end-to-end in a real browser (invalid credentials, successful login/redirect, logout/redirect)
- [x] Security review pass focused specifically on the new authentication/authorization code before considering this phase done — no findings

## Phase 5 — Core Backend API: Articles

- [x] CRUD endpoints for Article (create/update/delete/list) — `GET/POST /api/articles`, `PATCH/DELETE /api/articles/:id`, all behind `requireAuth`; delete is blocked with a 409 if the article is referenced by existing `OrderItem`/`RepeatingOrderItem` rows (FK `RESTRICT`) rather than erroring with a raw 500 — note Prisma 7's pg driver adapter surfaces constraint violations as a raw `DriverAdapterError` with a Postgres error code on `error.cause.code`, not the usual `PrismaClientKnownRequestError`/`P2003`, so this needed its own detection helper (`src/lib/prismaErrors.ts`)
- [x] Availability computation: `available && (capacityPerCycle == null || currentCycleOrderedQty < capacityPerCycle)` — `src/lib/availability.ts`, verified live against a real order/order-item row inserted for the current open cycle
- [x] Endpoint for the public order form: articles + `acceptingOrders` (derived from current cycle status) + reopen date/holiday message — `GET /api/public/articles`, no auth required
- [x] Zod request/response schemas in `packages/schemas` — `packages/schemas/src/article.ts`, consumed by the backend as a workspace dependency

## Phase 6 — Core Backend API: Cycles

- [x] Endpoints: get current cycle, list cycle history — `GET /api/cycles/current`, `GET /api/cycles`, both behind `requireAuth`
- [x] Admin action: "Start next cycle" (pre-fills suggested next open/close/delivery dates, editable before confirm) — `GET /api/cycles/next-suggestion` returns the pre-fill (shifts the last cycle's window forward 7 days, or falls back to the Saturday/Monday/Wednesday pattern from today if there's no prior cycle); `POST /api/cycles` creates it from whatever dates the admin actually confirms
- [x] Admin action: "Close ordering" — `PATCH /api/cycles/:id/close`, only succeeds from `OPEN`
- [x] Admin action: "Mark delivered" (→ COMPLETED) — `PATCH /api/cycles/:id/deliver`, only succeeds from `CLOSED`
- [x] Enforce single-OPEN-cycle invariant at the API level — `POST /api/cycles` checks for an existing `OPEN` cycle and 409s (on top of the DB partial unique index from Phase 3); duplicate `label` also 409s instead of leaking a raw Prisma error
- [ ] "Start next cycle" triggers RepeatingOrder cloning — deferred until Phase 8 builds the `RepeatingOrder` CRUD/model support to clone from

## Phase 7 — Core Backend API: Orders

- [x] CRUD endpoints for Order (create, update/edit, delete) — `GET/POST /api/orders`, `GET/PATCH/DELETE /api/orders/:id`, all behind `requireAuth`; server always re-prices items from the live `Article.price` (never trusts a client-supplied price/total), mirroring the snapshotted-`unitPrice` design from Phase 3
- [x] List endpoint with search, sort, filter, and status support (Not received / In Progress / Delivered) — `GET /api/orders` accepts `status`, `cycleId`, `archived` (defaults to excluding archived), `search` (recipient/phone/location/email, case-insensitive), `sortBy`/`sortDir`
- [x] Archive workflow (distinct from delete) — `PATCH /api/orders/:id/archive` / `/unarchive` toggle the new `Order.archived` flag; `DELETE` remains a hard delete for invalid orders, per the "no Cancelled status" design in `project-scope.md`
- [x] Manual order creation endpoint (admin path, no cycle-open requirement beyond normal validation) — `POST /api/orders` takes an explicit `cycleId` and doesn't require that cycle to currently be `OPEN` (the baker can log a late/manual order against a cycle that just closed); this is also the only order-creation path for now, since the public order form still goes through n8n until Phase 13
- [x] Validate order items against current cycle's article availability/capacity at creation time — `src/lib/orderPricing.ts`'s `priceAndValidateItems`, reusing Phase 5's `computeAvailability`/`getOrderedQuantitiesByArticle`; also re-run on item edits with the order's own prior items excluded from the capacity count, so shrinking/keeping a quantity doesn't self-block — verified live (capacity-exceeded rejection, self-exclusion on edit, and a separate order still correctly blocked)

Schema note: added `Order.email` (nullable — the old n8n form collected it but never persisted it as a column; needed now for Phase 10's customer confirmation email) and `Order.archived` (boolean, default false) via migration `20260716091310_add_order_email_archived`.

## Phase 8 — Core Backend API: Repeating Orders

- [x] CRUD endpoints for RepeatingOrder — `GET/POST /api/repeating-orders`, `GET/PATCH/DELETE /api/repeating-orders/:id`, all behind `requireAuth`; no capacity check here since a RepeatingOrder is just a template — capacity is only enforced at actual clone time
- [x] "Make repeating" endpoint: creates a RepeatingOrder from an existing Order, links `order.repeatingOrderId` — `POST /api/orders/:id/make-repeating`, copies recipient/phone/email/location/remark/items without altering the original order's own content
- [x] Clone-on-cycle-start logic: for every RepeatingOrder, create a new Order in the new cycle (subject to capacity, no bypass), linked via `repeatingOrderId` — `src/lib/cloneRepeatingOrders.ts`, wired into `POST /api/cycles`; runs sequentially (not in parallel) so each clone's capacity check sees the orders already created earlier in the same run — verified live that a capacity conflict skips just that one repeating order (with a reported reason) without blocking the others or the cycle-start itself
- [x] Order-form submission accepts a `repeat` flag that also creates a RepeatingOrder — since the public order form still goes through n8n until Phase 13, this landed as the new `POST /api/public/orders` endpoint (no auth, requires a currently `OPEN` cycle, unlike the admin path in Phase 7) with a `repeat: boolean` field — verified live end-to-end

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
