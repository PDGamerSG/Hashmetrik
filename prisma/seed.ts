import { PrismaClient } from "../lib/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { SERVICES } from "../lib/content.ts";

/**
 * Brings a fresh database up to the point where somebody can sign in.
 *
 * Two things: the service catalogue, which every client and project hangs off,
 * and the first administrator. Both are idempotent — run it as often as you
 * like.
 *
 * There is no signup route for staff anywhere in the app on purpose. The first
 * account is made here, by someone with the database URL:
 *
 *   ADMIN_EMAIL=you@hashmetrik.in ADMIN_PASSWORD='…' npx prisma db seed
 *
 * Re-running it updates the password for an existing address rather than
 * failing, which is also how a forgotten password gets reset.
 *
 * Its own client rather than `lib/db.ts`: that module is marked `server-only`
 * and this is a plain Node script.
 */

/** The catalogue, taken from the marketing copy so the two cannot drift apart. */
async function seedServices(prisma: PrismaClient) {
  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { slug: service.id },
      create: { slug: service.id, name: service.name, code: service.code },
      update: { name: service.name, code: service.code },
    });
  }
  console.log(`Services ready: ${SERVICES.length}`);
}

async function seedAdmin(prisma: PrismaClient) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("No ADMIN_EMAIL/ADMIN_PASSWORD set — skipping the admin account.");
    return;
  }
  if (password.length < 12) {
    throw new Error("Use a password of at least 12 characters — this account reads everything.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  /* `update` sets the role as well as the password: this is also the way to
     promote an account that was made as an ordinary user, and the way back
     into an admin account whose password has been lost.

     `suspendedAt: null` for the same reason. This script is the last door into
     the platform when every other one is shut, and a suspension it could not
     lift would be one that leaves the database as the only way back — which is
     exactly the state this exists to prevent. */
  const admin = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role: "ADMIN", status: "NON_CLIENT", name: "Administrator" },
    update: { passwordHash, role: "ADMIN", suspendedAt: null },
  });

  console.log(`Admin ready: ${admin.email}`);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  await seedServices(prisma);
  await seedAdmin(prisma);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
