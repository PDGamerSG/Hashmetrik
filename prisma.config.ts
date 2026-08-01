import { defineConfig, env } from "prisma/config";

/* Prisma 7 no longer loads `.env` itself, and the CLI needs `DATABASE_URL`
   before this config is evaluated. Node's own loader covers it without adding
   dotenv; a missing file is normal in CI, where the variable is already set. */
try {
  process.loadEnvFile(".env");
} catch {
  /* no .env — rely on the ambient environment */
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Node 24 strips the types itself, so the seed needs no extra runner.
    seed: "node --env-file-if-exists=.env prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
