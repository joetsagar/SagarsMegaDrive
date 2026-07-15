import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { db } from "@/lib/db";

export const auth = betterAuth({
  appName: "SagarsMegaDrive",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // There is no public registration route — the single administrator
    // account is created by prisma/seed.ts, not through this API.
    disableSignUp: true,
  },
  plugins: [
    twoFactor({
      issuer: "SagarsMegaDrive",
    }),
  ],
});
