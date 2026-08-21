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
  // Deliberately NOT setting `partitioned: true` (CHIPS) here — that's for
  // cookies used inside a cross-site iframe, which the admin panel never is
  // (it's always loaded top-level). Setting it anyway caused a real bug: a
  // transient 401 ("Unauthorized") right after login, on the very first
  // fetch(es) the just-redirected page fires — the browser needs extra time
  // to commit a Partitioned cookie compared to a plain one, which lands
  // right in the gap between the sign-in redirect and the following
  // requests. Confirmed via a captured production fetch log showing genuine
  // 401s (not just a UI race) immediately post-login.
  advanced:
    process.env.NODE_ENV === "production"
      ? {
          defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
          },
        }
      : undefined,
});
