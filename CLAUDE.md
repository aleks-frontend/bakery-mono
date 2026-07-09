# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A monorepo replacing a bakery's n8n-workflows-writing-to-a-Google-Sheet order system with a real backend: Node/Express/Prisma/PostgreSQL, plus the existing admin panel and public order form. Orders come from exactly two places (public form submissions, manual admin entry) and must land in one reliable database.

Read these in order before making non-trivial changes — they are the source of truth, not this file:

- `project-scope.md` — problem statement, MVP feature list, and the full domain model (Cycle/Article/RepeatingOrder design, notifications, payments, hosting decisions)
- `tech-stack.md` — the chosen stack per layer and why
- `implementation-plan.md` — the phased build checklist; check it to see what's actually been built vs. still planned

## Using Context7 for library docs

This repo pulls in several libraries whose APIs shift across versions (Prisma, Better Auth, Express 5, React Router, TanStack Query, Vite, Tailwind). Before writing code against one of them — especially anything involving setup/config, adapter wiring (e.g. Better Auth's Prisma adapter, Express route mounting), or an API you're not 100% certain is current — use the `context7` MCP tool to fetch up-to-date docs rather than relying on training data. Resolve the library ID first, then query the specific question (setup, migration, a specific API), not a broad topic.

## Commands

Run everything from the repo root; this is an npm workspaces monorepo (`apps/*`, `packages/*`).

```bash
npm install                        # installs and links all workspaces

npm run dev:backend                # apps/backend, tsx watch, http://localhost:3001
npm run dev:admin-panel            # apps/admin-panel, Vite, http://localhost:5173
npm run dev:order-form             # apps/order-form, Vite

npm run lint                       # single flat ESLint config, covers all apps/packages
npm run format                     # prettier --write .
npm run typecheck                  # tsc --noEmit in every workspace
npm run build                      # build in every workspace that has a build script

npm run <script> -w @bakery/<name> # run a script in one workspace directly,
                                    # e.g. npm run build -w @bakery/schemas
```

`docker-compose.yml` at the root runs Postgres + the backend for local dev (`docker compose up`) — untested on this machine since Docker isn't installed here; local dev currently uses a native Postgres install instead (see `apps/backend/.env` for the `DATABASE_URL`). No test runner is configured yet (Vitest/Supertest are planned per `tech-stack.md` but not yet scaffolded).

**Prisma**: schema lives at `apps/backend/prisma/schema.prisma`, config at `apps/backend/prisma.config.ts`. Prisma 7 generates the client into `apps/backend/src/generated/prisma` (gitignored, regenerated via the `postinstall` script) rather than `node_modules/@prisma/client`, and requires a driver adapter (`@prisma/adapter-pg`) passed to `new PrismaClient({ adapter })` — see `src/lib/prisma.ts`. Run migrations with `npm run prisma:migrate -w @bakery/backend`.

## Architecture

**Workspaces:**

| Path | What | Status |
|---|---|---|
| `apps/admin-panel` | React 18 + Vite admin SPA (`@bakery/admin-panel`) | Fresh-copied from the standalone `bakery-admin-panel` repo; still reads/writes via the old n8n webhook URLs (see its own `apps/admin-panel/CLAUDE.md`) |
| `apps/order-form` | React 18 + Vite public order form (`@bakery/order-form`) | Fresh-copied from the standalone `bakery-order-form` repo; same n8n dependency for now |
| `apps/backend` | Express 5 + TypeScript API (`@bakery/backend`), ESM, run via `tsx` | CORS + JSON middleware, `/health` (now checks live DB connectivity via Prisma), and a working Prisma + Postgres connection (`src/lib/prisma.ts`, driver-adapter based per Prisma 7 — see `prisma/schema.prisma`). No domain models or auth wired in yet |
| `packages/schemas` | Shared Zod schemas (`@bakery/schemas`) | Placeholder only — will hold `Order`/`Article`/`Cycle`/`RepeatingOrder` schemas once modeled, consumed by all three apps |
| `packages/api-client` | Shared TanStack Query hooks/mutations (`@bakery/api-client`) | Placeholder only — will replace each frontend's hand-rolled n8n fetch hooks once the backend has real endpoints |

The two frontends are deliberately kept as **separate apps**, not merged — different audiences (public order form vs. internal admin tool), different bundle-size/perf needs, and a cleaner auth boundary. They share code through the two `packages/*` workspaces instead.

**Migration path**: both frontends still talk to n8n webhooks directly (their existing `.env`/`src/services`/`src/lib/api.ts` fetch logic, untouched). The backend is being built out first (DB schema → auth → core API), then the admin panel gets rewired onto it, and the public order form last — see `implementation-plan.md` for the phase-by-phase order and why.

**Domain model** (fully specified in `project-scope.md`, summarized here): a bakery operates in weekly `Cycle`s (opens Saturday, closes Monday, delivers Wednesday, manually admin-controlled, no cron). `Article` (renamed from the old "BreadType") has an optional `capacityPerCycle` computed live against the current cycle's order totals. `RepeatingOrder` represents standing weekly orders that get cloned into a new `Order` every time a cycle starts, subject to the same capacity limits as any other order — no special-casing.

**Linting**: one root `eslint.config.js` (flat config, ESLint 9 + `typescript-eslint`) applies React rules to `apps/admin-panel`/`apps/order-form` and Node globals to `apps/backend`/`packages/*`. Don't add per-app ESLint config or dependencies — extend the root config instead.
