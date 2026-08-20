import * as Sentry from "@sentry/node";

// Imported first (before any other module) in index.ts, per Sentry's Node
// setup requirements — instrumentation has to be registered before the
// modules it patches (Express, Prisma, etc.) are themselves imported.
// No-ops if SENTRY_DSN is unset, same convention as RESEND_API_KEY in email.ts.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
});
