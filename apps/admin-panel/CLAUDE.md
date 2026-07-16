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
VITE_BACKEND_URL=                     # Real backend (health check, Better Auth, Articles API), default http://localhost:3001
VITE_API_BASE_URL=                    # GET    /webhook/bread-orders
VITE_UPDATE_STATUS_URL=               # PATCH  /webhook/bakery/orders/status
VITE_ADMIN_ORDER_URL=                 # POST   /webhook/admin/bakery-order
VITE_DELETE_ORDER_URL=                # DELETE /webhook/bakery/orders
VITE_ARCHIVE_ORDER_URL=               # POST   /webhook/bakery/orders/archive
```

The remaining webhooks (orders) are still n8n workflows — see `n8n/README.md` for details. Articles no longer go through n8n; they're wired straight to the real backend (see below).

## Architecture

React 18 + TypeScript SPA with routes `/login` → `LoginPage`, and `/` → `OrdersPage` / `/bread-types` → `BreadTypesPage` gated behind the `RequireAuth` guard, via react-router-dom `HashRouter` in `App.tsx`. `HashRouter` is used because the app is hosted on Loopia Autobahn (nginx shared hosting) where nginx config is not editable — the hash is never sent to the server so refreshes always work.

**Auth:** session-based login against the real backend's Better Auth instance (`src/lib/authClient.ts`, built on `@bakery/api-client`'s `createBakeryAuthClient`). `RequireAuth` (`src/components/RequireAuth.tsx`) redirects to `/login` when `useSession()` has no session; `Header.tsx` shows the logged-in user and a sign-out button.

**Data flow (orders):**
```
n8n webhook (GET) → fetchOrdersQueryFn() → Zod validation (APIOrderSchema)
  → mapApiOrderToOrder() → React Query cache → components via useOrdersQuery()
```

The API returns snake_case with unusual keys like `"Order ID"` and `"Ordered articles"`. `src/lib/orderMapper.ts` normalises these to camelCase. `src/lib/orderParser.ts` parses the raw articles string (`"• Item × qty = price RSD\n..."`) into `ParsedOrderItem[]` using a regex.

**Data flow (articles):**
```
@bakery/api-client's articlesClient (fetch, credentials: "include")
  → real backend GET/POST/PATCH/DELETE /api/articles
  → React Query cache ["articles"] → ArticlesPage / ArticlesTable / ArticleModal
```

Article CRUD is fully cut over to the real backend (Phase 5/9) — no more n8n or Google Sheets involved. The shared HTTP client and React Query hooks live in `packages/api-client` (`createHttpClient`, `createArticlesClient`, `useArticlesQuery`, etc.); this app's `src/lib/apiClient.ts` instantiates them against `VITE_BACKEND_URL`, and `src/hooks/useArticlesQuery.ts` (and siblings) are thin per-app wrappers binding that instance so components can keep importing from `@/hooks/*` like before. The old `acceptingOrders` flag (previously a `CONFIG` row in the Google Sheet, then a Bread Types page toggle) is gone from the Articles page entirely — it's now derived from `Cycle.status` and will resurface on a future Cycle control panel page, not here.

**Layer overview:**

| Layer | Path | Responsibility |
|-------|------|---------------|
| Types & schemas | `src/types/order.ts` (n8n orders); `@bakery/schemas` (`Article`, re-exported via `@bakery/api-client`) | Zod schemas for both API shape and frontend model |
| API + mapping | `src/lib/api.ts`, `orderMapper.ts`, `orderParser.ts` (n8n orders); `src/lib/apiClient.ts` (real backend, Articles) | Fetch, validate, transform |
| Hooks | `src/hooks/` | React Query wrappers consumed by components — Article hooks are thin bindings over `@bakery/api-client`'s shared hooks |
| Pages | `src/app/OrdersPage.tsx`, `src/app/ArticlesPage.tsx` | Search, filter, selection state, export triggers |
| Components | `src/components/` | Table, modals, PDF renderers, shadcn/ui primitives in `ui/` |
| i18n | `src/i18n/` | i18next init + `en.json`, `sr.json`, `hu.json` |
| n8n workflows | `n8n/` | Backend webhook definitions — import into n8n to run the system |

## Key conventions

- **Imports:** use `@/` alias for `src/` (e.g. `@/components/ui/button`).
- **Styling:** Tailwind utility classes + CSS variables (HSL) in `src/index.css`. Use `cn()` from `@/lib/utils` to merge classes.
- **shadcn/ui:** Radix-based primitives live in `src/components/ui/`. Do not edit them directly; add variants instead.
- **State:** No global state library. Server state via React Query (30 s staleTime). Component-local state for UI (search text, filter, row selection).
- **CRUD feedback:** `<Toaster />` mounted once in `src/main.tsx`. Every mutation hook (`src/hooks/use*Mutation.ts`) wraps its API call in `toast.promise(...)` — pending/success/error messages live in the hook, not the component. See the root `CLAUDE.md`'s "CRUD feedback" note for the full rule; `useCreateArticleMutation.ts` / `useUpdateArticleMutation.ts` / `useDeleteArticleMutation.ts` are the reference implementation.
- **i18n:** All user-visible strings go through `useTranslation()` / `t()`. Add keys to all three locale files (`en`, `sr`, `hu`) when adding UI copy.
- **TypeScript:** Strict mode with `noUnusedLocals` and `noUnusedParameters` — the build will fail on unused symbols.

## Maintenance rules

- **When adding an n8n workflow:** add a row to the `n8n/README.md` table and update the env var list in this file (`CLAUDE.md`).

## Known incomplete features

- No pagination (planned for large order lists).
- No date-range filter (planned).
