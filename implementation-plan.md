# Implementation Plan

Tracks what's still open. Phases 1–13, most of Phase 14 (deployment), and Phases 18/20/21 are fully complete and have been moved to `implementation-history.md` to keep this file focused — phase numbers are preserved across both files, so a phase mentioned here may have earlier, already-done context living in the history file instead. Read `project-scope.md`/`tech-stack.md` alongside this for the domain model and stack decisions; this file is just the checklist.

---

## Phase 14 — Cutover

Full deployment write-up (Dockerfiles, Railway setup, migrations, the admin-panel cross-site cookie fix, etc.) is in `implementation-history.md`'s Phase 14 entry. Only the outstanding cutover checklist remains here.

- [x] Run test/fake orders through both the admin panel and order form on the deployed production app — done ad hoc through various verification passes (email/CORS/domain/deep-link testing), each cleaned up afterward via direct SQL; not a dedicated baker-run "trial period" in the sense the original bullet meant
- [ ] Verify emails, PDFs, dashboard numbers, and cycle transitions all behave correctly under real-ish use — emails verified live; PDFs/dashboard/cycle transitions not specifically re-verified since the most recent changes
- [ ] Get baker sign-off on staging behavior — needs the baker's own confirmation, not something verifiable from a coding session
- [x] Point production order-form and admin panel domains at the new backend — both real domains (`order.lisztrapszodia.in.rs`, `admin-panel.lisztrapszodia.in.rs`) added as Railway custom domains, DNS configured via Loopia, verified serving the correct build with valid TLS certs
- [ ] Disable n8n webhooks the same day (hard cutover, no parallel-run period) — the order-form/admin-panel n8n webhooks were already retired back in Phase 13; the one remaining n8n dependency (the baker's Telegram notification workflow) is now fully confirmed working in production (see below), so **the old n8n workflow itself just needs to be deactivated** or the baker will get duplicate notifications
- [x] Wire up the Loopia subdomain for production once confirmed stable — done, see above
- [x] Set `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` on Railway's backend service — done; sent a real production test order, no send errors in Railway's logs (same fire-and-forget/log-only-on-failure pattern as email), test order cleaned up afterward via direct SQL

## Phase 15 — Responsive Header Navigation

Admin panel's `Header.tsx` collapses `Dashboard`/`Orders`/`Articles`/`Cycles`/`Repeating Orders` into a hamburger menu below custom breakpoints (`nav-md: 900px`/`nav-lg: 1100px`), prompted by a real user report that the header broke below ~1100px. Implementation is done and typecheck/lint-clean:

- [x] Below a threshold, collapse the horizontal nav into a hamburger icon button
- [x] Hamburger opens a dropdown with the same links
- [x] Preserve active-route highlighting inside the collapsed menu
- [x] Confirm `BackendHealthBadge`, `LanguageSelector`, and the sign-out button all remain reachable and usable at narrow widths too
- [ ] Manually verify at common breakpoints (mobile portrait, tablet) — not yet visually confirmed in a real browser; needs a manual pass across ~1400px → 1100px → 950px → 700px

## Phase 16 — Test Coverage (Unit + End-to-End)

`tech-stack.md` already names Vitest + Supertest for backend/frontend unit testing, but neither is scaffolded yet. No end-to-end tool has been chosen at all. This phase covers the whole monorepo, not just new code going forward.

- [ ] Scaffold Vitest in `apps/backend`, `apps/admin-panel`, `apps/order-form`, and `packages/*`, wired into each workspace's `package.json` and the root `npm test`
- [ ] Backend: Supertest-driven route tests for every router (`articles`, `cycles`, `orders`, `repeating-orders`, `public`, `dashboard`) plus unit tests for the pure/near-pure lib functions (`orderPricing`, `availability`, `cycleDates`, `dashboardStats`, `email`)
- [ ] Frontend: component/hook unit tests for both apps' critical flows (order creation/edit, article CRUD, cycle transitions, repeating-order cloning, dashboard rendering)
- [ ] Add an end-to-end tool — suggest **Playwright** (strong Vite/React support, can drive both `admin-panel` and `order-form` against a real running backend instance), open to Cypress if preferred
- [ ] End-to-end coverage of the two most business-critical flows at minimum: public order-form submission (article selection → submit → confirmation), and admin manual order lifecycle (create → edit → status change → archive)
- [ ] Decide whether/how tests run in CI — no CI pipeline exists yet, so this may be its own follow-up rather than in scope here
- [ ] Once coverage exists, fold "tests pass" into Phase 14's cutover checklist as a real gate rather than manual spot-checks

## Phase 17 — Concurrency-Safe Order Capacity Enforcement

Prompted by a real incident on the old n8n+Sheets system: a baker got the Telegram "new order" ping but the order row never made it into the Google Sheet — a silent write failure with no error surfaced anywhere.

**Good news, structurally already handled:** order creation writes to Postgres first, inside a transaction, and `sendOrderNotifications()` only fires *after* that write has committed successfully. There is no code path where a notification goes out for an order that was never persisted.

**Real gap found, not yet handled:** article capacity enforcement has its own race. `lib/orderPricing.ts`'s `priceAndValidateItems()` reads "how much of this article is already ordered this cycle", then compares against `Article.capacityPerCycle` — but this read happens *before and outside* the transaction that actually inserts the new order. If two customers submit orders for the same nearly-sold-out article within the same short window, both requests can read the same "already ordered" count, both pass the capacity check against stale data, and both get inserted — silently overselling past the cap.

- [ ] Make the capacity check-and-insert atomic — options: re-check capacity inside the same `$transaction` right before the insert (Postgres's default Read Committed isolation is *not* sufficient by itself; needs either `SELECT ... FOR UPDATE` row locking on the relevant `Article` rows, or `SERIALIZABLE` isolation with retry-on-conflict logic), or enforce it as a DB-level constraint (e.g. a trigger or a generated/check constraint keyed off a running total)
- [ ] Apply the same fix uniformly to both order-creation paths (`public.ts` and `orders.ts`) plus order *editing* (`priceAndValidateItems`'s `excludeOrderId` re-validation path), since an edit that increases quantity has the identical race
- [ ] Add a regression test once Phase 16's test infra exists: fire two concurrent requests for the same capacity-limited article and assert exactly one is accepted when only one unit of capacity remains
- [ ] Decide on customer-facing behavior for the rejected concurrent order — same "Some items are unavailable" 409 the capacity check already returns for the non-race case, so no new UI needed, just confirm it's reachable from this new code path too
- [ ] Audit for the same class of check-then-act race anywhere else in the codebase (e.g. the "at most one OPEN cycle" invariant — already enforced via a DB-level partial unique index, so likely fine, but worth a deliberate pass rather than assuming)

## Phase 19 — Out-of-Stock Articles with Similar-Article Suggestions (order-form)

Reminder only — not yet scoped in detail, revisit when this phase starts.

Currently `apps/order-form/src/App.tsx` filters unavailable articles out entirely (`.filter((a) => a.available)`) before they ever reach `OrderForm`, so a customer has no way to know an article exists but is sold out this cycle. Baker-requested: surface out-of-stock articles instead of hiding them, collapsed/hidden behind a toggle or button by default, and — for each out-of-stock article shown — suggest a similar available article as an alternative.

- [ ] The "similar article" suggestion implies a new data relationship on `Article` (a self-relation — likely `Article` ↔ `Article`, one- or many-directional, needs a schema/migration decision) plus an admin-panel UI for the baker to actually set which articles are similar to which; neither exists today
- [ ] Needs a decision on the public order-form UX: inline collapsed section vs. dedicated modal, and where in the article-picker flow the "show similar" suggestion appears relative to the sold-out item
- [ ] Revisit and flesh out the rest of this phase's checklist when implementation actually starts

## Phase 22 — Article Categories: Order-Form Grouping/Sorting + Workshop List

**High priority**, per a follow-up baker meeting — scope expanded from the original ask. Blocked on the baker providing the actual category list/taxonomy; nothing here can start until that exists.

Original ask: give `Article` an optional category (e.g. "Bread", "Pastry", "Focaccia" — exact taxonomy TBD with the baker), and use it to order/group the Workshop List PDF by category instead of today's flat first-seen-order listing.

**Expanded ask (confirmed with the baker directly, supersedes this phase's own earlier "out of scope unless asked" line)**: category also drives ordering *and* grouping of the order-form's article picker — this is now the primary motivation, not just a nice-to-have alongside the Workshop List grouping.

- [ ] Get the actual category list from the baker — hard blocker, nothing below can be scoped precisely (schema choice, UI, taxonomy for "uncategorized" articles) until this exists
- [ ] Schema change: add an optional `category` field to `Article` — needs a migration; decide whether it's a free-text string or a fixed enum/lookup table
- [ ] Add category as a field in the Articles admin UI (`ArticleModal`/`ArticlesTable`)
- [ ] Update `GET /api/public/articles` to sort/group by category instead of (or in addition to) the current catalog-array-position stopgap; decide within-group ordering
- [ ] Update the order-form's article picker component to render grouped sections (e.g. `<optgroup>`-equivalent), not just a flat sorted list
- [ ] Update `WorkshopListPdf.tsx`'s `summarizeWorkshopArticlesFromOrders()` to sort/section by `Article.category` first, then by name within each category
- [ ] Decide how to handle articles with no category set — likely an "Uncategorized" section at the end rather than silently interleaving them, for both the order-form picker and the Workshop List
- **Overlaps with Phase 26** (`flourType`, proposed for the exact same order-form grouping/sorting mechanism, before this baker conversation happened) — worth revisiting whether Phase 26 is now redundant/should merge into this phase once the baker's category list exists, rather than building two separate grouping attributes for the same UI. Flagged, not resolved.

## Phase 24 — Sentry.io Error Tracking

All three apps are wired up and verified — backend confirmed live with a real thrown error, both frontends confirmed to have the real DSN baked into their production bundles (after fixing a Dockerfile `ARG` gap that had silently left them running with `dsn: undefined` for a while). One verification step still outstanding:

- [ ] Trigger a real frontend error in production and confirm it lands in the Sentry dashboard — the backend side of this is already verified live, but the frontend SDKs haven't had a real error thrown at them yet

## Phase 25 — Preserve Intended Destination Through Login Redirect

Reminder only, follow-up from the Telegram-notification order deep-link work (`sendTelegramNotification` links to `?orderId=` on `OrdersPage`, opening that order's details modal directly) — not yet implemented.

Problem: `RequireAuth` (`apps/admin-panel/src/components/RequireAuth.tsx`) redirects an unauthenticated visit straight to `/login` via `<Navigate to="/login" replace />`, dropping whatever path/query the visit was actually for. A baker clicking the Telegram link while logged out lands on a bare login screen instead of back at the order they clicked through for.

- [ ] Capture the original location in `RequireAuth` when redirecting, e.g. `<Navigate to="/login" state={{ from: location }} replace />` (via `useLocation()`)
- [ ] `LoginPage.tsx` reads `location.state?.from` (falling back to `/` as today) and navigates there instead of always `/` once `signIn.email()` succeeds
- [ ] Verify it round-trips through a `?orderId=` deep link specifically, since that's the motivating case

## Phase 26 — Flour-Type Attribute for Ordering/Grouping the Order-Form Article Picker

Reminder only, follow-up to the catalog-order sort stopgap — not yet implemented.

**Likely superseded by Phase 22**: after this phase was written, the baker separately confirmed `category` (Phase 22's field, originally scoped just for the Workshop List PDF) should be the one used for order-form grouping/sorting — the exact same mechanism this phase proposes under a different name/taxonomy. Revisit whether this phase is still needed once Phase 22 ships, rather than building two grouping attributes for the same picker.

Current state: `GET /api/public/articles` sorts by each article's position in the seed catalog array (`src/lib/articlesCatalog.ts`) rather than alphabetically, so the order-form's article picker matches the old Google Sheet's ordering customers are used to. That works today but is inherently fragile — the order is implicit in a source file's array position, invisible in the admin panel, and any article added later through the UI (not the seed catalog) just falls to the end with no way to place it elsewhere.

Ask: add a real `flourType` (or similar — exact taxonomy TBD, e.g. "White", "Rye", "Spelt", "Einkorn") attribute to `Article`, and use it to both order and group the order-form's article `<select>`/picker — replacing the catalog-array-position hack with something the baker can actually see and manage.

- [ ] Schema change: add the attribute to `Article` — needs a migration; decide free-text vs. a fixed enum/lookup (same open question Phase 22 already flagged for its own proposed `category` field — worth deciding both at once rather than separately, since they may end up being the same underlying concept or need to coexist)
- [ ] Add the field to the Articles admin UI (`ArticleModal`/`ArticlesTable`) for create/edit
- [ ] Update `GET /api/public/articles` to sort/group by the new attribute instead of (or in addition to) catalog order; decide the within-group ordering (alphabetical? a secondary manual order?)
- [ ] Update the order-form's article picker component to actually render grouped sections (e.g. `<optgroup>`-equivalent), not just a flat sorted list
- [ ] Decide how to handle articles with no attribute set (existing ones, until backfilled) — likely an "Other"/uncategorized group rather than erroring or silently hiding them
- [ ] Once this lands, the catalog-array-position sort in `GET /api/public/articles` (and possibly `articlesCatalog.ts`'s role as an ordering source at all, vs. just a seed dataset) can be retired

## Phase 27 — Seasonal Article Attribute (Per-Cycle Opt-In Availability)

Shipped in `feature/seasonal-articles` (PR #1), under the name `isSeasonal` rather than this phase's originally-proposed `isSpecial` — same underlying idea (an article that isn't guaranteed to be available every cycle), but the design that actually landed differs from the plan below in two ways: it auto-resets every cycle instead of staying manually toggled, and it warns rather than strips on repeat. Details:

- [x] Schema change: `isSeasonal Boolean @default(false)` on `Article` (migration `add_article_is_seasonal`)
- [x] Add the toggle to the Articles admin UI (`ArticleModal`/`ArticlesTable`) — switch on the article form, "Seasonal" badge in the table
- [x] Order-form article picker: seasonal articles get a `(Seasonal)` suffix in the item picker and the out-of-stock list
- [x] **Went beyond the original ask**: rather than a plain manual toggle, `available` on every `isSeasonal` article is now automatically reset to `false` at the start of every cycle (`POST /api/cycles`), and the baker opts specific ones back in for that cycle from a new checklist on the Start Cycle screen (`seasonalArticleIds`, unchecked by default each time) — a stronger, more automatic reading of "not guaranteed available in future cycles" than this phase originally scoped
- [x] **Repeating-order interaction — resolved differently than originally scoped**: rather than stripping seasonal articles out of the cloned `RepeatingOrder`, the order form now shows a non-blocking informational notice (near the repeat checkbox, and again in the confirmation modal) warning the customer that a repeating order containing a seasonal item isn't guaranteed to include it in future cycles. The item is still cloned each cycle same as any other item; if it's not currently available (baker didn't opt it in), the existing capacity/availability check already used by `cloneRepeatingOrdersIntoCycle` naturally skips it and records a `RepeatingOrderCloneFailure` for baker review, same as any other unavailable article — no new code needed there.
- [ ] **Still open, not built**: actually excluding seasonal articles from the generated `RepeatingOrder` template (as this phase originally asked), plus baker/customer-facing messaging about which item(s) got dropped, and deciding what happens if that stripping leaves a repeating order with zero items — only relevant if the informational-warning approach above turns out to be insufficient in practice and stripping is wanted after all

