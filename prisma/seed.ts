import { PrismaClient } from "../lib/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

/**
 * Creates the first admin.
 *
 * There is no signup route anywhere in the app on purpose — staff accounts are
 * made here, by someone with the database URL. Run it with:
 *
 *   ADMIN_EMAIL=you@hashmetrik.in ADMIN_PASSWORD='…' npx prisma db seed
 *
 * Re-running it updates the password for an existing address rather than
 * failing, which is also how a forgotten password gets reset.
 *
 * Its own client rather than `lib/db.ts`: that module is marked `server-only`
 * and this is a plain Node script.
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) throw new Error("DATABASE_URL is not set.");
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD to seed an admin account.");
  }
  if (password.length < 12) {
    throw new Error("Use a password of at least 12 characters — this account reads every lead.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });

  console.log(`Admin ready: ${admin.email}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
