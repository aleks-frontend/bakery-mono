# Bakery Order Form – React + TypeScript (Vite)

Production-ready single-page application converted from the original HTML + vanilla JS bakery ordering system.

## Tech Stack

- **React 18** + **TypeScript** (strict, no `any`)
- **Vite** – build tool
- **TanStack Query** – bread types fetch & order submit mutation
- **React Hook Form** + **useFieldArray** – form state & dynamic items
- **Zod** + **@hookform/resolvers/zod** – validation
- **React Hot Toast** – notifications
- **React Modal** – confirmation modal
- **Tailwind CSS** – styling (warm bakery aesthetic)
- **i18next (react-i18next)** – i18n (en, sr, hu)

## Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

Copy the example env file and set your URLs:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_BREAD_TYPES_URL=https://n8n.aleksthecoder.com/webhook/bread-types
VITE_ORDER_SUBMIT_URL=https://n8n.aleksthecoder.com/webhook/bakery-order
```

Values are read in the app via `import.meta.env.VITE_BREAD_TYPES_URL` and `import.meta.env.VITE_ORDER_SUBMIT_URL` (see `src/services/api.ts`).

## 3. Tailwind CSS

Tailwind is already configured:

- `tailwind.config.js` – content paths, bakery theme colors, font
- `postcss.config.js` – Tailwind + Autoprefixer
- `src/index.css` – `@tailwind base/components/utilities`

No extra setup needed after `npm install`.

## 4. i18n (react-i18next)

- **Languages:** en, sr, hu
- **Files:** `src/i18n/en.json`, `src/i18n/sr.json`, `src/i18n/hu.json`
- **Init:** `src/i18n/index.ts` – loads resources, sets initial language from `localStorage` key `bakery-lang`, persists on change
- **Usage:** `const { t } = useTranslation()` and `t('Key')` everywhere (no hardcoded UI strings)

## 5. Run and build

**Development:**

```bash
npm run dev
```

**Production build:**

```bash
npm run build
```

**Preview production build:**

```bash
npm run preview
```

## 6. Project structure

```
src/
  components/     # Small reusable components
  hooks/          # useBreadTypes, useSubmitOrder, usePersistedCustomer
  services/       # api.ts (env-based URLs, fetch, Zod validation)
  schemas/        # orderSchemas.ts (Zod schemas)
  types/          # orderTypes.ts
  utils/          # calculations.ts
  i18n/           # en.json, sr.json, hu.json, index.ts
  App.tsx
  main.tsx        # QueryClient, Toaster, Modal.setAppElement, i18n import
```

## 7. Behaviour summary

- **Bread types:** Fetched with TanStack Query; response validated with Zod. On failure, fallback bread types and `acceptingOrders = true`.
- **Order submit:** POST body matches original JS; response validated with Zod; toasts on success/error.
- **Form:** React Hook Form + Zod; `useFieldArray` for items; total derived from selected bread and quantities; submit disabled when no items or `!acceptingOrders`.
- **OrderStatusBanner:** Shown when `acceptingOrders === false`; form hidden; link to external site.
- **Loading:** Spinner while fetching bread types; modal shows spinner and disables buttons while submit mutation runs.
- **Local storage:** `bakery-lang` for language, `bakery-order` for customer data (restored on load).

## 8. Logo and static assets

- Place `logo.png` in the project root; Vite serves files from `public/` at `/`. So either:
  - Copy `logo.png` into a `public/` folder so it is available at `/logo.png`, or
  - Keep it in root and ensure your Vite config serves it (e.g. put it in `public/` for standard behaviour).

Recommended: create `public/` and copy `logo.png` there so the app’s `<img src="/logo.png" />` works.

## Legacy HTML version

The original `index.html` was replaced by the Vite entry point. If you need the legacy HTML + JS version, restore it from git history or keep a copy (e.g. `index.legacy.html`).
