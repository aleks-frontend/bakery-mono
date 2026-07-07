## Monorepo layout

- **Package manager**: npm workspaces — the existing `bakery-admin-panel` and `bakery-order-form` repos already use npm (package-lock.json), so this keeps continuity rather than introducing pnpm/yarn for no reason.
- No Turborepo/Nx for now — three apps + a shared package is small enough to run with plain workspace scripts. Revisit only if build/test times become a real pain.
- Suggested structure:
  ```
  apps/
    admin-panel/     ← existing React admin app, moved in as-is
    order-form/      ← existing public order form, moved in as-is
    backend/         ← new Node/Express/Prisma API
  packages/
    schemas/         ← shared Zod schemas (Order, Article, Cycle, RepeatingOrder)
    api-client/      ← shared TanStack Query hooks + mutations, built on packages/schemas
  ```
- The shared `schemas` and `api-client` packages are the main monorepo payoff: today the order-form and admin panel each hand-declare their own Zod schemas and fetch logic for the same shapes (`OrderSchema`, `BreadTypeSchema`, `useBreadTypes`, `useSubmitOrder`, etc.). Centralizing these means the backend, admin panel, and order form all validate against the exact same types and call the backend through the exact same hooks — no re-implementing a mutation in each app every time an endpoint changes.
- Deliberately kept as **two separate apps**, not merged into one with an unprotected public route. The order form is customer-facing and likely lives on the baker's main public domain, while the admin panel is a heavier internal tool on its own subdomain with a real auth boundary. Sharing code through `packages/api-client` gets the reuse benefit without turning the admin app's login requirement into a per-route carve-out.

## Frontend (admin panel + order form)

- **React + TypeScript + Vite** — both existing apps already use this, carried over unchanged.
- **Tailwind CSS** — already in use in the admin panel.
- **React Router v7** — already in use.
- **TanStack Query** — already used in both apps for data fetching; hooks and mutations move into `packages/api-client` so both apps share the exact same query keys, fetch logic, and cache behavior against the new backend.
- **TanStack Table** — already used in the admin panel for the order list (search/sort/filter fits directly into the MVP order list requirements).
- **@react-pdf/renderer** — already used in the admin panel; carries over directly for order receipts, workshop/production lists, and package stickers, no new PDF library needed.
- **Zod** — already used in both apps for form/response validation; becomes the shared validation layer via `packages/schemas`.
- Radix UI primitives, `class-variance-authority`, `lucide-react`, `i18next` — existing admin panel choices, no change needed.

## Backend

- **Node.js + Express + TypeScript**
- **Better Auth** for authentication, using:
  - `prismaAdapter` (Postgres provider) for database-backed sessions — no separate session store needed
  - `toNodeHandler` mounted at `/api/auth/*` in Express
  - Single admin account for MVP (email+password is enough; no social login, no multi-user roles yet)
- **Zod** for request validation on every route boundary, reusing `packages/schemas`
- No scheduler/cron library — Cycle transitions (open/close/complete) are deliberate manual admin actions, not time-triggered, so nothing needed here for MVP
- **Email notifications**: needs a transactional email provider for the customer confirmation + admin new-order emails. Suggest **Resend** (simple API, generous free tier, plays well with Railway) — open to swapping for Nodemailer + SMTP if you already have a mailbox/provider you'd rather reuse from the n8n setup.

## Database & ORM

- **PostgreSQL**
- **Prisma** as ORM — schema will cover `Order`, `Article`, `Cycle`, `RepeatingOrder`, plus Better Auth's own tables (`User`, `Session`, etc. via the Prisma adapter)

## Testing & tooling

- **Vitest** across frontend and backend (consistent with the existing Vite-based apps)
- **Supertest** for backend API route tests
- **ESLint** (already configured in the admin panel) + **Prettier** for formatting, shared config at the repo root

## Deployment & hosting

- **Docker** — a Dockerfile per app (admin panel, order form, backend), plus a `docker-compose.yml` for local dev (Postgres + backend, and optionally the two frontends)
- **Railway** for hosting all three services + the Postgres database
- Production domain: baker's subdomain on **Loopia**, wired up later once the app is ready — Railway service(s) will sit behind that subdomain via CNAME
- Note for later: since the admin panel and order form may end up on different subdomains/origins than the backend, Better Auth's cookie config (domain/SameSite) and CORS will need to account for that — not a blocker now, just something to configure when the real domains are set.
