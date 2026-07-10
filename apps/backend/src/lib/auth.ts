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
});
