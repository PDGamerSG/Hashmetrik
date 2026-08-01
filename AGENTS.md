<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# The backend

It is inside this app — no second service. Setup: `docs/backend-setup.md`. Design and
what is deliberately not built yet: `docs/superpowers/specs/`.

Three things that are not what you would guess:

- **`middleware.ts` does not exist here.** Next 16 renamed it; the file is `proxy.ts`.
  It only checks that a session cookie is present. Authorisation is `verifySession()`
  in `lib/auth/dal.ts`, called by every admin page and every admin server action —
  never rely on the proxy for it.
- **Prisma 7 has no Rust engine.** The connection URL is not in `schema.prisma`; it is
  in `prisma.config.ts` for migrations and in the `@prisma/adapter-pg` adapter in
  `lib/db.ts` for queries. The client is generated to `lib/generated/prisma` and is not
  committed, so `npm run build` runs `prisma generate` first.
- **There are two root layouts**, `app/(site)` and `app/(admin)`. That is why the 404
  for unmatched URLs is `app/global-not-found.tsx` rather than a plain `not-found.tsx`.

Auth is hand-rolled `jose` sessions, not Auth.js, following Next 16's own
authentication guide. Tests are `node --test` over pure logic only: `npm test`.
