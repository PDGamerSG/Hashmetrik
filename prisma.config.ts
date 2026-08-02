import { defineConfig } from "prisma/config";

/* Prisma 7 no longer loads `.env` itself, and the CLI needs `DATABASE_URL`
   before this config is evaluated. Node's own loader covers it without adding
   dotenv; a missing file is normal in CI, where the variable is already set. */
try {
  process.loadEnvFile(".env");
} catch {
  /* no .env — rely on the ambient environment */
}

/* Read straight off the environment rather than through `env()`. That helper
   throws while the config file is still being evaluated, which takes down every
   command equally — including `prisma generate`, which only reads the schema and
   has no use for a connection string. A build machine with no database attached
   (Vercel, CI) could therefore never run `npm run build`. The datasource is
   omitted when the variable is absent, so `generate` succeeds and the migration
   commands, which genuinely need it, still fail with Prisma's own message. */
const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Node 24 strips the types itself, so the seed needs no extra runner.
    seed: "node --env-file-if-exists=.env prisma/seed.ts",
  },
  ...(url ? { datasource: { url } } : {}),
});
