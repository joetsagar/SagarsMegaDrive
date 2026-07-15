import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

// A seed-only Better Auth instance with public sign-up re-enabled, so we can
// create the single administrator account through the library's own hashing
// path instead of reimplementing it. This instance is never mounted to a
// route — the app's real config (lib/auth.ts) keeps disableSignUp: true.
const seedAuth = betterAuth({
  appName: "SagarsMegaDrive",
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, disableSignUp: false },
});

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administrator";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the administrator account.");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Administrator account already exists for ${email}, skipping.`);
    return;
  }

  await seedAuth.api.signUpEmail({ body: { name, email, password } });
  console.log(`Administrator account created for ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
