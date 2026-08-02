<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# The backend

It is inside this app — no second service. Setup: `docs/backend-setup.md`. Design and
what is deliberately not built yet: `docs/superpowers/specs/`.

Four things that are not what you would guess:

- **`middleware.ts` does not exist here.** Next 16 renamed it; the file is `proxy.ts`.
  It authenticates — is there a live, correctly signed session — and routes. It does
  **not** authorise. Never add a role check to it: the token's role is whatever was true
  when it was signed, and an admin activating a client changes the answer immediately.
- **Authorisation reads the database, not the cookie.** `requireAdmin`, `requireStaff`
  and `requireClient` in `lib/auth/dal.ts` look up the live user row every request
  (deduped by React `cache()`). Every gated page **and every server action** calls one
  itself — an action is its own endpoint and never passes through the proxy.
- **Prisma 7 has no Rust engine.** The connection URL is not in `schema.prisma`; it is
  in `prisma.config.ts` for migrations and in the `@prisma/adapter-pg` adapter in
  `lib/db.ts` for queries. The client is generated to `lib/generated/prisma` and is not
  committed, so `npm run build` runs `prisma generate` first.
- **There are three root layouts**: `app/(site)`, `app/(app)` and `app/(admin)`. That is
  why the 404 for unmatched URLs is `app/global-not-found.tsx`, not `not-found.tsx`.

Two conventions worth keeping:

- **Stores are split.** `lib/x/store.ts` is `server-only` and holds the queries;
  `lib/x/schema.ts` (or `series.ts`) holds the pure half. Tests are `node --test` and
  cannot resolve the `@/` alias, so anything worth testing goes in the pure file.
- **Client-reachable queries are scoped inside the `where`.** `{ id, project: { clientId } }`,
  never fetch-then-check. The check cannot be forgotten and someone else's row returns
  nothing, which is also the right answer to give back.

Auth is hand-rolled `jose` sessions, not Auth.js, following Next 16's own
authentication guide.
