# bakery-mono

A real order management system for a bakery, replacing an n8n-workflows-into-a-Google-Sheet setup with a proper backend and database. Orders come from exactly two places — a public order form and manual admin entry — and both land in one PostgreSQL database instead of a spreadsheet that can silently lose or shift rows.

See [`project-scope.md`](./project-scope.md) for the full problem statement, MVP scope, and domain model (weekly ordering cycles, article capacity limits, repeating orders). See [`tech-stack.md`](./tech-stack.md) for the stack per layer, and [`implementation-plan.md`](./implementation-plan.md) for the phased build checklist and current progress.

## Structure

npm workspaces monorepo:

```
apps/
  admin-panel/   React + Vite admin SPA
  order-form/    React + Vite public order form
  backend/       Express + TypeScript API
packages/
  schemas/       Shared Zod schemas
  api-client/    Shared TanStack Query hooks/mutations
```

`admin-panel` and `order-form` were migrated in from their own standalone repos and still talk to the old n8n webhooks for now — they get rewired onto `apps/backend` in later phases (see `implementation-plan.md`).

## Getting started

```bash
npm install
cp apps/backend/.env.example apps/backend/.env
cp apps/admin-panel/.env.example apps/admin-panel/.env.local   # add VITE_BACKEND_URL for local dev
```

Run each app individually:

```bash
npm run dev:backend        # http://localhost:3001
npm run dev:admin-panel    # http://localhost:5173
npm run dev:order-form
```

Or start Postgres + the backend together:

```bash
docker compose up
```

Other useful root-level commands:

```bash
npm run lint         # ESLint across every workspace
npm run typecheck     # tsc --noEmit in every workspace
npm run format        # prettier --write .
npm run build         # build every workspace that has a build script
```

## Status

Phase 1 (monorepo setup) is complete. See [`implementation-plan.md`](./implementation-plan.md) for what's next.
