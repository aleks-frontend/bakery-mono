# Implementation Plan

Build order: backend + DB first → auth → admin panel wired up next (so the baker can trust/use the new system early) → public order form (reprioritized ahead of notifications/PDF/dashboard now that the admin panel is done and the order form is the last remaining n8n dependency — see the note before Phase 10) → notifications/PDF/dashboard → staging validation → hard cutover from n8n.

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

Being done in chunks; see the checklist below for what's actually wired up so far vs. still on n8n.

- [x] Article management UI (CRUD, availability toggle, capacity field) — first chunk, done. Old `BreadTypesPage`/`BreadTypesTable`/`BreadTypeModal`/`useBreadTypesQuery` (n8n-backed) replaced by `ArticlesPage`/`ArticlesTable`/`ArticleModal` at `/articles`, backed entirely by the real backend. Added `packages/api-client/src/http.ts` (shared fetch wrapper, `credentials: "include"` for Better Auth's cookie session) and `src/articles.ts` (`createArticlesClient` + `useArticlesQuery`/`useCreateArticleMutation`/`useUpdateArticleMutation`/`useDeleteArticleMutation`/`useUpdateArticleAvailabilityMutation`, the last composing per-id PATCH calls client-side since the backend has no bulk-availability endpoint). Admin panel's own hooks (`src/hooks/useArticlesQuery.ts` etc.) are thin bindings over a singleton client in `src/lib/apiClient.ts`, keeping the existing per-hook-file import convention. `ManualOrderModal` also switched its article-picker data source to the new backend (its own order *submission* is still n8n, pending the Orders chunk). Dropped the old "Accepting Orders" toggle from this page entirely — that's a `Cycle.status` concept now, to resurface on the Cycle control panel chunk. Verified live end-to-end in a real headless-Chrome run (login → list → create → edit/toggle availability → delete), which also caught and fixed a real bug: `http.ts` special-cased 204 responses without consuming the response body, causing spurious `net::ERR_ABORTED` logging on every delete. Follow-up in the same chunk: added `react-hot-toast` to `apps/admin-panel` (mounted once in `src/main.tsx`) and moved all Article mutation feedback onto it — each `use*ArticleMutation` hook wraps its API call in `toast.promise(...)` (pending/success/error), replacing the inline `submitError`/`availabilityError` state that `ArticleModal.tsx`/`ArticlesTable.tsx` had. `useDeleteArticleMutation` now takes `ids: string[]` uniformly (single delete is just a 1-item array) so bulk and single delete share one code path and one toast. This is now the standing convention for all future CRUD wiring — see root `CLAUDE.md`'s "CRUD feedback" rule.
- [x] Order list: search/sort/filter/status, backed by the new list endpoint — second chunk, done. Unlike Articles (client-side filtering, since that endpoint has no query params), `OrdersPage` sends `search`/`status`/`sortBy`/`sortDir` straight to `GET /api/orders` and refetches on change — matches this bullet's "backed by the new list endpoint" wording exactly. Added `packages/api-client/src/orders.ts` (`createOrdersClient` + plain `useOrdersQuery`) and `src/cycles.ts` (`createCyclesClient` + `useCurrentCycleQuery`, just the `current()` read Orders needs — full Cycle CRUD is its own future chunk). Dropped the old cuid-unfriendly "Order ID" table column entirely (kept in the details modal/PDF footer only) since it's not a meaningful sort/scan axis for a baker the way recipient/date/status are.
  - Follow-up (user-requested): added a `cycle: true` join to `orderInclude` in `apps/backend/src/routes/orders.ts` (used by every Orders route — list/get/create/update/archive/unarchive all return it now) and a matching `cycle: cycleSchema.optional()` field on `orderSchema` in `packages/schemas/src/order.ts`, mirroring how `OrderItem.article` was already joined. `OrdersTable` shows the cycle's label in a new non-sortable "Cycle" column (backend's `sortBy` enum doesn't support it) between Date and Location. Verified live: backend response includes the full `Cycle` object, table renders the label correctly.
- [x] Order edit UI (admin correcting a customer-reported mistake) — same chunk. `ManualOrderModal` (create-only) generalized into `OrderFormModal` (create *and* edit, `order` prop present → PATCH instead of POST, mirroring `ArticleModal`'s pattern), wired to a new "Edit Order" button in `OrderDetailsModal`. Collapsed the old firstName/lastName split into one `recipient` field to match the backend's actual schema. Manual/edited order creation needs a `cycleId`; since there's no Cycle-management UI yet, it auto-targets `GET /api/cycles/current` and disables submission with an explanatory message if none is open — a real interim limitation until the Cycle control panel chunk lands.
- [x] Archive/delete UI — same chunk. `ArchiveConfirmModal` generalized to take an injectable `onArchive` prop (was hard-wired to a single order-specific hook), matching `DeleteConfirmModal`'s existing pattern. `useDeleteOrderMutation`/`useArchiveOrderMutation` take `ids: string[]` uniformly (single row is a 1-item array) with one `toast.promise` per batch; added `useBulkUpdateOrderStatusMutation` for the same reason on bulk status changes, alongside the existing per-row `useUpdateOrderMutation`.
- [x] Replace n8n/Sheets calls with `packages/api-client` hooks throughout — **Orders was the last n8n dependency in the admin panel**; it is now fully off n8n (remaining: cycles, repeating orders, neither of which had any admin UI before). Deleted `src/types/order.ts`, `lib/orderMapper.ts`, `lib/orderParser.ts`, `lib/api.ts`, and all n8n order env vars (`VITE_API_BASE_URL`, `VITE_UPDATE_STATUS_URL`, `VITE_ADMIN_ORDER_URL`, `VITE_DELETE_ORDER_URL`, `VITE_ARCHIVE_ORDER_URL`) — only `VITE_BACKEND_URL` remains in `.env.example`. Updated the 3 PDF components (`OrderReceiptPdf`/`PackageStickersPdf`/`WorkshopListPdf`) and `exportSelectedOrdersXls.ts` from the old raw-bullet-string `orderedArticlesParsed`/`orderedArticlesRaw` shape to the new structured `OrderItem[]` (`item.article.name`, `item.quantity`, `item.unitPrice`); `WorkshopListPdf`'s gram-weight summarization now extracts the trailing "NNNg" straight from `article.name` (e.g. "Focaccia - ~800g") instead of parsing it out of an order-line string. `StatusBadge`/`StatusDropdown` moved to the backend's `NOT_RECEIVED`/`IN_PROGRESS`/`DELIVERED` enum, mapped back to the existing human-readable i18n keys rather than adding new ones.
  - Verified live via the headless-Chrome driver (login → list → search → sort → create manual order against the auto-selected open cycle → view details → edit → per-row status change → archive), zero console/network errors on the final run. Caught and fixed two real bugs along the way: (1) `http.ts` never actually parsed responses through Zod, so every `Date`-typed field (`createdAt`, etc.) was silently a raw ISO string at runtime — fixed with a JSON-parse reviver in `http.ts` that converts ISO date strings back to real `Date` objects, at the shared layer so it also covers `Cycle`'s three date fields once that chunk lands, not just Orders; (2) `OrderFormModal`'s "reset form on open" effect unconditionally cleared the item's `articleId` on every open, and the separate "prefill first article" effect only re-ran when the (already-loaded, stable-reference) articles list changed — so a brand-new order could never actually get a default article selected. Fixed by reading `articles` directly in the reset effect instead of relying on the second effect to backfill it.
  - Follow-up fix (reported by the user): editing an order's item quantity from the details modal didn't update the UI until the modal was closed and reopened. Root cause: `OrdersPage` stored `selectedOrder` as a captured object snapshot from the click that opened the modal, which the query-cache invalidation after a successful edit never touched. Fixed by storing `selectedOrderId` instead and deriving `selectedOrder` from the live `orders` array each render.
  - Follow-up feature (user-requested): a "Show archived" toggle on `OrdersPage`, since archiving previously had no way to view/undo it — an order effectively vanished forever once archived, with no admin UI surfacing `archived=true` orders (the old n8n-based system had this same gap). Added `useUnarchiveOrderMutation`; per-row Archive/Delete actions in `OrdersTable`/`OrderDetailsModal` now show an Unarchive icon+action instead when `order.archived` is true (unarchive applies immediately, no confirm dialog, since it's non-destructive — only archiving, which hides the order, is confirmed). Bulk panel's archive button swaps to "Unarchive selected" the same way. This also matters for the future Phase 12 dashboard: order-volume/status stats need to query across all orders regardless of `archived`, not just the default non-archived view, or archiving an order would silently drop it from historical counts.
    - This surfaced a real, previously-latent **backend bug** in `orderListQuerySchema` (`packages/schemas/src/order.ts`): `archived: z.coerce.boolean().default(false)` used JS's `Boolean(str)` coercion, where the *string* `"false"` is truthy — so an explicit `?archived=false` was silently coerced to `true`, returning only archived orders instead of excluding them. It was undetected until now because no caller had ever explicitly sent `archived=false`; everyone relied on the default. Fixed with `z.string().optional().transform(v => v === "true")` instead.
- [x] Cycle control panel: current cycle status, "Start next cycle" / "Close ordering" / "Mark delivered" buttons — third chunk, done. New `CyclesPage` at `/cycles` (nav link added to `Header.tsx`). Since `GET /api/cycles/current` only ever returns an `OPEN` cycle (by definition), the panel instead derives its state from `GET /api/cycles` (full history, sorted by delivery date desc) and takes the most recent entry — that single "latest cycle" drives which action is offered (`COMPLETED`/none → Start Next Cycle, `OPEN` → Close Ordering, `CLOSED` → Mark Delivered), plus a Cycle History table below for everything older. `StartCycleModal` pre-fills from `GET /api/cycles/next-suggestion` (editable before confirm, per the plan's own wording) using plain `<input type="date">` fields; `useStartCycleMutation` also surfaces a secondary toast if any repeating orders failed to clone into the new cycle (`repeatingOrdersCloned` array from the `POST /api/cycles` response). Close/Deliver actions go through a new small generic `ConfirmActionDialog` (title/description/confirm — reusable, unlike the entity-specific `DeleteConfirmModal`/`ArchiveConfirmModal`). `packages/api-client/src/cycles.ts` expanded from the Orders chunk's minimal `current()`-only client to the full `CyclesClient` (`list`/`nextSuggestion`/`start`/`close`/`deliver`/`reopen`/`undoDeliver`). Verified live end-to-end via the headless-Chrome driver (close → deliver → start next cycle with auto-computed +7-day suggested dates → new cycle shows OPEN, old one moves to history as COMPLETED), zero console/network errors.
  - Follow-up (user-requested, after discussing what happens on an accidental "Close Ordering" click): added `PATCH /api/cycles/:id/reopen` (`CLOSED → OPEN`) and `PATCH /api/cycles/:id/undo-deliver` (`COMPLETED → CLOSED`), surfaced as a "Reopen Ordering" button next to Mark Delivered and an "Undo Mark Delivered" button next to Start Next Cycle. Both are direct actions with no confirmation dialog (mirroring the Order archive/unarchive asymmetry: confirm on the action that restricts/hides something, skip it on the one that's purely undoing a mistake) — safe because nothing else in the system keys off the OPEN/CLOSED/COMPLETED boundary (repeating-order cloning happens on cycle *creation*, not on close or deliver) and the panel only ever exposes actions on the single most-recent cycle, so there's no window where a stale action could conflict with a cycle started in the meantime. Also fixed the now-inaccurate "This cannot be undone." copy on the Mark Delivered confirm dialog.
  - **TODO / reconsider**: per the same discussion, `COMPLETED` may not need to exist as its own `CycleStatus` at all — flagged with a comment at `apps/backend/src/routes/cycles.ts`'s `/deliver` route. Today it has exactly one behavioral effect anywhere in the codebase (gating whether the admin panel shows "Start Next Cycle"); it doesn't touch `Order` rows, doesn't bulk-update the separate, unrelated `Order.status` field (which also happens to have a `DELIVERED` value — easy to confuse with `Cycle.status = COMPLETED`), and doesn't trigger PDFs or emails. A simpler model might drop `COMPLETED` and allow starting the next cycle straight from `CLOSED`. Not done now since it's a schema-level decision (`CycleStatus` enum, `project-scope.md`'s domain model) — just flagged as worth reconsidering rather than acted on.
- [x] Repeating orders admin list + edit/delete + "Make repeating" action on an order row — fourth chunk, done. New `RepeatingOrdersPage` at `/repeating-orders` (nav link added to `Header.tsx`, after Cycles), following the Articles chunk's simpler pattern (no separate read-only details modal — the row's "Edit" action opens `RepeatingOrderFormModal` directly, create and edit in one component, mirroring `OrderFormModal` minus the cycle/status fields RepeatingOrder doesn't have). `RepeatingOrdersTable` shows recipient/phone/location plus a truncated "article ×qty, article ×qty" items summary. Added `packages/api-client/src/repeatingOrders.ts` (`createRepeatingOrdersClient` + `useRepeatingOrdersQuery`, no mutation hooks exported — same convention as `orders.ts`, since the admin panel builds its own `toast.promise`-wrapped mutations directly per the root `CLAUDE.md`'s CRUD feedback rule) and a `makeRepeating(id)` method on `OrdersClient` hitting the existing `POST /api/orders/:id/make-repeating` from Phase 8. "Make repeating" itself surfaces two places: an icon-only row action in `OrdersTable` (Repeat icon) and a full-width button in `OrderDetailsModal`'s footer — both hidden once `order.repeatingOrderId` is already set, to avoid accidentally creating a second orphaned `RepeatingOrder` template from the same order (the backend endpoint has no idempotency guard, it always creates a new one and overwrites the link).
  - Fixed a real, previously-latent **schema bug** while wiring this up: `repeatingOrderItemSchema` in `packages/schemas/src/repeatingOrder.ts` was missing the `article: articleSchema.optional()` field that `orderItemSchema` has, even though the backend's `repeatingOrderInclude` always joins `Article` on every repeating-order route. Nothing had rendered `item.article` yet since there was no admin UI for this entity before now, so the gap was invisible — the frontend type just didn't have the field to read. Fixed by adding it, matching `OrderItem`'s pattern exactly.
  - Verified live end-to-end against the real backend (not a headless-browser UI run this time — no browser automation tool was available in this session): logged in via Better Auth's `/api/auth/sign-in/email` with a cookie jar, then exercised the exact HTTP contract the new frontend clients use — create/list/update/delete on `/api/repeating-orders` (confirmed the joined `article` survives on create/list), and `POST /api/orders/:id/make-repeating` on a real seeded order (confirmed `Order.repeatingOrderId` gets set). Cleaned up the test rows afterward (direct SQL, since `updateOrderSchema` has no API path to unlink `repeatingOrderId`) so the seed data is unchanged. `npm run typecheck` and `npm run lint` both pass clean across all workspaces with zero new errors/warnings.
- [x] Manual order entry form (phone/in-person orders) — already satisfied, no further work needed. This was built as a side effect of the Orders chunk (see the second bullet above): `OrdersPage`'s "Add Manual Order" button opens `OrderFormModal` with no `order` prop (create mode), which is exactly this feature — a baker enters recipient/phone/email/location/remark plus items for a phone or in-person order, targeting whatever cycle `GET /api/cycles/current` returns. It was never explicitly checked off as its own line item since it landed bundled into the Orders chunk's work rather than as a separately-scoped task.
- [ ] Add a "repeat this order" checkbox to `OrderFormModal` in create mode (manual order entry), with the same explanatory copy as the Phase 13 order-form checkbox below — lets the baker set up a standing order in one step instead of creating the order and then separately clicking "Make Repeating" afterward. Open implementation question for whenever this is picked up: `POST /api/orders` (the admin creation endpoint) has no `repeat` flag today, unlike `POST /api/public/orders` (Phase 8) — either extend the admin endpoint with the same flag, or have the frontend chain a `make-repeating` call after a successful create when the box is checked.

**Phase 9's originally-scoped chunks are complete; the "repeat this order" checkbox above was added afterward as a follow-up and is still open.**

**Reprioritization note:** the public order form (`apps/order-form`, Phase 13 below) is now the *only* remaining n8n dependency anywhere in the system — the admin panel is fully off n8n as of this phase. So Phase 13 is next, ahead of Phases 10–12. Notifications, PDF exports, and the dashboard are all additive, admin-facing features with no dependency on the order-form migration itself; they can land in any order after Phase 13 without blocking it or the eventual Phase 14 cutover. Phase numbers below are left as-is (not renumbered) so existing cross-references elsewhere in this doc and in commit messages stay accurate — just read Phase 13 next, then circle back to 10–12.

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
- [ ] Add "repeat this order" checkbox to the form, wired to the `repeat` flag (`POST /api/public/orders` already supports this per Phase 8, so this is frontend-only). Needs real explanatory copy next to the checkbox, not just a bare label — customers should understand that checking it subscribes them to receive this same order automatically every week going forward, e.g. "Get this order delivered automatically every week" / "Subscribe me to this order weekly" (exact wording TBD, needs i18n across `en`/`sr`/`hu` like the admin panel). Same copy should be reused for the admin panel's equivalent checkbox (Phase 9's still-open item above) so the concept reads consistently in both places.
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
