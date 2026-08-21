import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";

const DEFAULT_TRUSTED_ORIGINS = [
  "http://localhost:5173", // admin-panel dev server
  "http://localhost:5174", // order-form dev server
];

export const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : DEFAULT_TRUSTED_ORIGINS;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // There's only ever one admin account for this app; it's provisioned by
    // the seed script, not through public sign-up.
    disableSignUp: true,
  },
  trustedOrigins,
  // In production the admin panel and backend sit on different hostnames
  // (genuinely different sites, not just different ports on localhost), so
  // the session cookie needs SameSite=None to survive a cross-site fetch.
  // Scoped to production only: Secure cookies are never sent over the plain
  // http://localhost dev servers, where the default SameSite=Lax already
  // works fine since same-host-different-port counts as same-site.
  //
  // `partitioned: true` (CHIPS) is required here, not optional — tried
  // removing it on the theory that it only matters for cross-site iframes
  // (which this app never is), but direct testing proved that wrong: without
  // it, the session cookie never worked at all (`GET /api/orders` kept
  // returning 401 even 2+ seconds after a successful sign-in, and a fresh
  // reload bounced straight back to /login — not a timing race, a total
  // failure). Chrome's third-party-cookie blocking treats *any* cross-site
  // cookie context this way, plain `fetch(..., { credentials: "include" })`
  // included, not just iframes — CHIPS is the sanctioned way to keep a
  // SameSite=None cookie working once third-party cookies are blocked.
  // Restored after confirming the removal made things strictly worse.
  advanced:
    process.env.NODE_ENV === "production"
      ? {
          defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
            partitioned: true,
          },
        }
      : undefined,
});
