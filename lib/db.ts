import "server-only";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * The database handle.
 *
 * Prisma 7 has no Rust engine, so the connection is made through a driver
 * adapter rather than a URL in the schema. The pool is held on `globalThis` in
 * development because every hot reload re-evaluates this module, and a fresh
 * pool per reload exhausts the database's connection limit within a few edits.
 * Production evaluates it once, so the cache is skipped there.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env — see docs/backend-setup.md.",
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? create();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
