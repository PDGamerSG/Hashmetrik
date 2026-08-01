# Backend setup

The backend lives inside this Next.js app — there is no second service to deploy.
Everything below is on a free tier.

Nothing here has been run against a real database yet. The code compiles, the pure
logic is tested and the routes were exercised locally without one, but the queries,
the login and the dashboard's data are unproven until you do the steps below. Expect
to find something.

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

Put it in `.env` as `SESSION_SECRET`. Changing it later signs every admin out, which is
also how you revoke a session in a hurry.

## 3. The first admin

There is no signup page anywhere in the app. Accounts are made from the command line:

```sh
ADMIN_EMAIL=you@hashmetrik.in ADMIN_PASSWORD='a long passphrase' npm run db:seed
```

Minimum twelve characters — the account reads every lead. Re-running it against an
existing address resets that password, which is the recovery path too.

Then sign in at `/admin/login`.

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
| `app/(admin)/admin` | Leads dashboard, behind the session cookie. |
| `proxy.ts` | Sends visitors without a cookie to the login page. Not the security check. |
| `lib/auth/dal.ts` | The security check. Called by every admin page and action. |

## Checking it

```sh
npm test          # pure logic: validation, sessions, rate windows, parsing
npm run typecheck
npm run build
```

To exercise the database path locally without Neon:

```sh
docker run --name hm-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:17
# DATABASE_URL="postgresql://postgres:dev@localhost:5432/postgres"
npm run db:deploy && npm run db:seed
```

## Not built yet

Client and team dashboards, projects, deliverables, the content calendar, KPI
analytics, the CMS and public signup. Those are later slices; see
`docs/superpowers/specs/` for the design of this one.
