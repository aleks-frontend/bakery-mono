# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # tsc && vite build
npm run lint      # ESLint with --max-warnings 0 (zero warnings allowed)
npm run preview   # Preview production build
```

No test runner is configured.

## Environment

Copy `.env.example` to `.env` and fill in all variables:

```
VITE_BACKEND_URL=                     # Real backend (health check, Better Auth, Articles/Orders API), default http://localhost:3001
```

As of Phase 9's Orders chunk, the admin panel is fully cut over to the real backend — no n8n webhooks or env vars remain. (The public order form, `apps/order-form`, is a separate app and still goes through n8n until Phase 13.)

## Architecture

React 18 + TypeScript SPA with routes `/login` → `LoginPage`, and `/` → `OrdersPage` / `/articles` → `ArticlesPage` gated behind the `RequireAuth` guard, via react-router-dom `HashRouter` in `App.tsx`. `HashRouter` is used because the app is hosted on Loopia Autobahn (nginx shared hosting) where nginx config is not editable — the hash is never sent to the server so refreshes always work.

**Auth:** session-based login against the real backend's Better Auth instance (`src/lib/authClient.ts`, built on `@bakery/api-client`'s `createBakeryAuthClient`). `RequireAuth` (`src/components/RequireAuth.tsx`) redirects to `/login` when `useSession()` has no session; `Header.tsx` shows the logged-in user and a sign-out button.

**Data flow (articles and orders) — the same shape for both:**
```
@bakery/api-client's articlesClient / ordersClient (fetch, credentials: "include")
  → real backend GET/POST/PATCH/DELETE /api/articles, /api/orders
  → React Query cache ["articles"] / ["orders", params] → pages/components via src/hooks/*
```

Both entities are fully cut over to the real backend — no n8n or Google Sheets involved anywhere in this app. The shared HTTP client and React Query hooks live in `packages/api-client` (`createHttpClient`, `createArticlesClient`, `createOrdersClient`, `createCyclesClient`, plain query hooks like `useArticlesQuery`/`useOrdersQuery`/`useCurrentCycleQuery`); this app's `src/lib/apiClient.ts` instantiates one client instance per entity against `VITE_BACKEND_URL`. `src/hooks/*` are thin per-app wrappers: query hooks (`useArticlesQuery.ts`, `useOrdersQuery.ts`, `useCurrentCycleQuery.ts`) just bind the shared query hook to this app's client instance; mutation hooks build their own `useMutation` directly against the plain client functions (not `@bakery/api-client`'s mutation hooks, which exist but go unused here) so `toast.promise(...)` feedback (see "CRUD feedback" below) can wrap each call from the start.

`Order` list/search/filter/sort is server-side (`GET /api/orders` query params: `status`, `search`, `sortBy`, `sortDir`), unlike `Article`'s list (no query params on the backend, so `ArticlesPage` still filters client-side over the full fetched set) — don't assume the two pages follow the same filtering pattern.

Manual order creation (`OrderFormModal`) requires a `cycleId`; since there's no Cycle management UI yet, it auto-targets whatever `GET /api/cycles/current` returns and disables submission with an explanatory message if no cycle is open. `OrderFormModal` also handles *editing* an existing order (`order` prop present → PATCH instead of POST, `cycleId` omitted/immutable) — it replaced the old create-only `ManualOrderModal`, and `OrderDetailsModal`'s new "Edit Order" button opens it in edit mode.

The old `acceptingOrders` flag (previously a `CONFIG` row in the Google Sheet, then a Bread Types page toggle) is gone from the Articles page entirely — it's now derived from `Cycle.status` and will resurface on a future Cycle control panel page, not here.

**Archive/unarchive pattern** (currently `Order`-only — no other entity has archive semantics in the domain model, so don't generalize this into a shared component prematurely if a future entity doesn't actually need it): archiving hides an order from the default list (`GET /api/orders` excludes `archived: true` unless asked), so it goes through `ArchiveConfirmModal` same as delete. Unarchiving is non-destructive — it just restores visibility — so it applies immediately with no confirmation (`useUnarchiveOrderMutation`, called directly from the row action / bulk panel / details modal). `OrdersPage`'s "Show archived" toggle flips the list between the two views by passing `archived: showArchived` into `useOrdersQuery`; `OrdersTable`'s per-row action and the bulk panel's archive button both swap icon+label (Archive → Unarchive, via `ArchiveRestore` from lucide-react) based on `order.archived` / `showArchived` rather than being two separate always-visible buttons. If another entity ever needs this, copy this split (confirm-only-on-hide, direct-on-restore) rather than confirming both directions.

**Layer overview:**

| Layer | Path | Responsibility |
|-------|------|---------------|
| Types & schemas | `@bakery/schemas` (`Article`, `Order`, `Cycle`, re-exported via `@bakery/api-client`) | Zod schemas for both API shape and frontend model |
| API | `src/lib/apiClient.ts` (real backend, all entities) | Client instantiation only — fetch/validate/transform lives in `packages/api-client` |
| Hooks | `src/hooks/` | React Query wrappers consumed by components — thin bindings over `@bakery/api-client`'s shared query hooks / clients |
| Pages | `src/app/OrdersPage.tsx`, `src/app/ArticlesPage.tsx` | Search, filter, sort, selection state, export triggers |
| Components | `src/components/` | Table, modals, PDF renderers, shadcn/ui primitives in `ui/` |
| i18n | `src/i18n/` | i18next init + `en.json`, `sr.json`, `hu.json` |

## Key conventions

- **Imports:** use `@/` alias for `src/` (e.g. `@/components/ui/button`).
- **Styling:** Tailwind utility classes + CSS variables (HSL) in `src/index.css`. Use `cn()` from `@/lib/utils` to merge classes.
- **shadcn/ui:** Radix-based primitives live in `src/components/ui/`. Do not edit them directly; add variants instead.
- **State:** No global state library. Server state via React Query (30 s staleTime). Component-local state for UI (search text, filter, row selection).
- **CRUD feedback:** `<Toaster />` mounted once in `src/main.tsx`. Every mutation hook (`src/hooks/use*Mutation.ts`) wraps its API call in `toast.promise(...)` — pending/success/error messages live in the hook, not the component. Bulk operations (bulk delete/archive/status-change) get exactly one toast for the whole batch, not one per row — see `useDeleteOrderMutation.ts`/`useArchiveOrderMutation.ts`/`useBulkUpdateOrderStatusMutation` for the `Promise.all(...)`-wrapped pattern. See the root `CLAUDE.md`'s "CRUD feedback" note for the full rule; `useCreateArticleMutation.ts` / `useUpdateArticleMutation.ts` / `useDeleteArticleMutation.ts` are the reference implementation.
- **i18n:** All user-visible strings go through `useTranslation()` / `t()`. Add keys to all three locale files (`en`, `sr`, `hu`) when adding UI copy. `OrderStatus` values are `NOT_RECEIVED`/`IN_PROGRESS`/`DELIVERED` (matching the backend enum) but `StatusBadge.tsx` maps them to the existing human-readable i18n keys ("Not received", "In Progress", "Delivered") rather than adding new SCREAMING_SNAKE_CASE-keyed translations.
- **TypeScript:** Strict mode with `noUnusedLocals` and `noUnusedParameters` — the build will fail on unused symbols.

## Known incomplete features

- No pagination (planned for large order lists).
- No date-range filter (planned).
- Manual order creation/editing has no article-capacity validation feedback beyond the toast error surfaced by the backend's 409 (no inline "N remaining" hint in the item picker yet).
