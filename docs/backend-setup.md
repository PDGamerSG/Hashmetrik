# Backend setup

The backend lives inside this Next.js app — there is no second service to deploy.
Everything below is on a free tier.

The whole product model is built and has been run end to end against the live Neon
database: signup, sign-in, the four areas, activation, projects, deliverables and
their approval loop, the content calendar, KPI entry and reporting, the CMS through
to the public page, settings and the audit trail.

What has *not* been exercised is anything needing a third-party key. Groq and Resend
were absent, so the assistant was only confirmed to return its 503 and the lead email
only confirmed to be skipped. Paste the keys in and both light up with no code change.

## 1. Database — Neon

1. Create a project at [neon.tech](https://neon.tech). Any region; Singapore or Mumbai
   is closest to Hyderabad.
2. Copy the **pooled** connection string (it has `-pooler` in the host). The pooled one
   matters: serverless functions open a connection per invocation and the direct string
   runs out of them.
3. Put it in `.env` as `DATABASE_URL`.

```sh
cp .env.example .env      # then fill it in
npm run db:deploy         # creates the tables from prisma/migrations
```

`npm run db:deploy` applies the committed migration. Use `npm run db:migrate` instead
only when you have changed `prisma/schema.prisma` and want a new migration written.

Neon's free tier suspends the compute when idle, so the first request after a quiet
spell takes a second or two. That is normal and costs nothing.

## 2. Session secret

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Put it in `.env` as `SESSION_SECRET`. Changing it later signs everyone out, which is
also how you revoke every session in a hurry — the proxy verifies the signature, so a
cookie signed with the old secret lands on the login form rather than looping.

## 3. Seeding — services and the first admin

```sh
ADMIN_EMAIL=you@hashmetrik.in ADMIN_PASSWORD='a long passphrase' npm run db:seed
```

Two things happen. The six services from `lib/content.ts` are written to the `Service`
table — every client, project and KPI hangs off one, so this has to run before anybody
can be made a client. And the first administrator is created.

Minimum twelve characters; the account reads everything. Re-running it against an
existing address resets the password **and** sets the role back to `ADMIN`, which is
both the recovery path and the way to promote an account made through signup.

Then sign in at `/admin/login`.

### Who can do what

| Role | Signs in at | Gets | Made by |
|---|---|---|---|
| `REGISTERED_USER` / `NON_CLIENT` | `/login` | `/dashboard` — profile, consultations, notices | Public signup at `/signup` |
| `REGISTERED_USER` / `CLIENT` | `/login` | the above plus `/dashboard/client` — work, calendar, reports | An admin activating them |
| `TEAM_MEMBER` | `/login` | `/team` — queue, projects, calendar, reports | An admin, at `/admin/team` |
| `ADMIN` | `/admin/login` | `/admin` — everything | The seed script, or another admin |

There is no route anywhere that creates a staff account from public input, and no way
to promote one through the interface. Activation — turning a registered account into a
client — is the one action that grants access to a whole area, and it is audited.

**Roles are read from the database, not from the session cookie.** The token carries a
role so the proxy can route without a query, but `lib/auth/dal.ts` looks up the live row
before letting anyone in. That is what makes an activation take effect on the client's
next page load rather than their next sign-in, and what makes a revoked account stop
working immediately rather than when its cookie expires.

## 4. Email — Resend

1. Create a key at [resend.com/api-keys](https://resend.com/api-keys) → `RESEND_API_KEY`.
2. Add `hashmetrik.in` under Domains and publish the DNS records it gives you.
   **Until that verifies, Resend will only deliver to your own account address** — the
   lead notification will fail for `info@hashmetrik.in` and you will see it logged.
3. `LEAD_FROM_EMAIL` must be on the verified domain. `LEAD_NOTIFY_EMAIL` is where leads
   land.

Without a key, leads are still saved — the email is skipped and the lead shows as
"not emailed" in the dashboard.

## 5. Assistant — Groq

1. Key from [console.groq.com/keys](https://console.groq.com/keys) → `GROQ_API_KEY`.
2. `GROQ_MODEL` defaults to `llama-3.3-70b-versatile`. **Check it is still offered** —
   Groq retires models, and a name that no longer exists returns a 400 that surfaces as
   "the assistant is unavailable". Their models list is the authority.

Without a key the endpoint returns 503 and the panel says it is not connected.

The system prompt is built in `lib/ai/prompt.ts` from `lib/content.ts`, so it follows
the site's copy. Editing what the assistant knows means editing those files and
redeploying — there is no admin screen for it.

Public and unauthenticated, so it is capped at 30 messages per IP per hour. If the
counter's table is unreachable the request is allowed through rather than blocked, on
the grounds that a database blip should not take the feature down; Groq's own limits
are the backstop.

## 6. Vercel

Add every variable from `.env.example` under Settings → Environment Variables, for all
environments you use. The build command needs no change: `npm run build` already runs
`prisma generate` first, which is required because the generated client is not
committed.

One thing to confirm rather than assume: Vercel's Hobby plan is for non-commercial use.
Once the site is bringing in client revenue, that is the first thing likely to need a
paid plan.

## What runs where

| Path | What it does |
|---|---|
| `app/actions.ts` | Booking and contact submissions. Saves, then emails. |
| `app/api/assistant/route.ts` | The homepage chat bubble. Rate limited, then Groq. |
| `app/(site)` | The marketing site, plus `/insights` from the CMS. |
| `app/(app)` | `/login`, `/signup`, `/dashboard`, `/team`. One root layout for all four. |
| `app/(admin)/admin` | The admin area. Its own login page and its own root layout. |
| `proxy.ts` | Routes a request with no live session to a login page. **Not** the security check. |
| `lib/auth/gate.ts` | The proxy's decision table, kept pure so it is testable. |
| `lib/auth/dal.ts` | The security check. `requireAdmin`, `requireStaff`, `requireClient`. |
| `lib/*/store.ts` | Queries. Marked `server-only`; every client-reachable one is scoped by `clientId` inside the `where`. |
| `lib/*/schema.ts`, `series.ts` | The pure half of each store, so `node --test` can reach it. |
| `lib/audit.ts` | Who did what. Written on access and money changes only. |

Three route groups means three root layouts, which is why the 404 for an unmatched URL
is `app/global-not-found.tsx` rather than a plain `not-found.tsx`.

## Checking it

```sh
npm test          # pure logic: validation, sessions, gate policy, periods, slugs
npm run typecheck
npm run lint
npm run build
```

To exercise the database path locally without Neon:

```sh
docker run --name hm-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:17
# DATABASE_URL="postgresql://postgres:dev@localhost:5432/postgres"
npm run db:deploy && npm run db:seed
```

If you run a browser-driven pass against the live database, everything it creates is
addressed `e2e-`, and `node --env-file=.env scripts/e2e-cleanup.ts` removes exactly
those rows and nothing else.

## Not built yet

- **File uploads.** Deliverables and creatives are links — Drive, Dropbox, Figma —
  rather than uploads. Vercel Blob would slot in behind the same `fileUrl` field; the
  reason to wait is that video is what exhausts a free object store first.
- **Automated KPI pulls.** Numbers are typed in. Every record carries a `source`, so a
  later Vercel Cron job hitting the Meta and Google APIs can upsert its own rows and
  leave anything a person entered alone.
- **Email beyond the lead notification.** Activation, approvals and scheduled calls all
  produce an in-app notification; none of them sends mail. `lib/email.ts` is the place.
- **Password reset.** The seed script resets an admin's; there is no self-serve flow.
- **Pagination.** Every list is capped at 200 rows. That is a working queue, not a
  scaling decision — revisit when a table actually runs long.
