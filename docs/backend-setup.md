# Backend setup

The backend lives inside this Next.js app — there is no second service to deploy.
Everything below is on a free tier.

The whole product model is built and has been run end to end against the live Neon
database: signup, sign-in, the four areas, activation, projects, deliverables and
their approval loop, the content calendar, KPI entry and reporting, the CMS through
to the public page, settings and the audit trail.

What has *not* been exercised is anything needing a third-party credential. Groq, SMTP
and the Google service account were absent, so the assistant was only confirmed to return
its 503, and the lead email and the sheet append only confirmed to be skipped. Fill those
in and all three light up with no code change.

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

## 4. Email — SMTP, via nodemailer

Currently Gmail, sending to and from `hashmetrik@gmail.com`.

1. Turn on [2-Step Verification](https://myaccount.google.com/signinoptions/two-step-verification)
   for that account. App passwords do not exist without it — the page in step 2 simply
   will not appear.
2. Create one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords),
   named anything. Copy the 16 characters — it is shown once. Spaces are cosmetic; strip
   them.
3. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=hashmetrik@gmail.com`,
   `SMTP_PASS=` the app password.

**Gmail rewrites `From:` to whichever account authenticated**, so `LEAD_FROM_EMAIL` is
only honoured on a host that permits it — keep it matching `SMTP_USER` here.
`LEAD_NOTIFY_EMAIL` is where leads land, and `Reply-To` is set to the person who wrote
in, so replying from the inbox answers them rather than the site.

Port 465 is implicit TLS and 587 is STARTTLS; `lib/email.ts` derives which from the
number, so there is no separate flag to get wrong. Moving off Gmail later means changing
the four `SMTP_*` variables and nothing else — Gmail's own ceiling is about 500 sends a
day, far above lead volume, but a domain-authenticated sender lands in fewer spam folders.

Without credentials, leads are still saved — the email is skipped and the lead shows as
"not emailed" in the dashboard.

## 4b. Google Sheet — a copy of every enquiry

Both bookings and contact-form submissions append a row. It is a convenience copy, not
the record: the database is the record, and the admin CRM at `/admin/leads` is where a
lead is actually worked.

1. At [console.cloud.google.com](https://console.cloud.google.com), create or pick a
   project.
2. **APIs & Services → Library** → enable **Google Sheets API**.
3. **APIs & Services → Credentials → Create credentials → Service account.** Name it;
   skip the optional role and user-access steps.
4. Open it → **Keys → Add key → Create new key → JSON**. A file downloads.
5. From that file: `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `private_key` →
   `GOOGLE_PRIVATE_KEY`. Paste the key verbatim, `\n` escapes and all, in double quotes —
   `lib/sheets/store.ts` turns them back into newlines, which is what lets one PEM live on
   one line of `.env` or in a Vercel field.
6. Create the spreadsheet and **share it with that `client_email` as an Editor**. This is
   the step everyone forgets, and without it every append returns 403.
7. `GOOGLE_SHEETS_ID` is the long string in the sheet's URL between `/d/` and `/edit`.
   `GOOGLE_SHEETS_TAB` must match the tab's name exactly — a new spreadsheet calls its
   first tab `Sheet1`, which is what this one is set to. Renaming the tab means changing
   this variable in the same breath, or every append 400s.

The header row is written automatically the first time the app appends to an empty sheet,
so there is nothing to set up inside the spreadsheet itself.

It also repairs itself. If the header write fails — a cold start pushing it past its
timeout is the way this actually happens — the first lead lands in row 1 with nothing
above it, and a check for "row 1 is non-empty" would read that damage as *already
labelled* and preserve it forever. So `writeHeaderIfMissing` tests whether row 1 **is**
the header, and when it finds a lead there instead, rewrites the sheet one row down with
the header on top. Nothing is discarded; the misplaced row keeps its data and moves to
row 2. It gives up rather than rewriting more than 2,000 rows.

Values are sent `RAW` rather than `USER_ENTERED` on purpose. `USER_ENTERED` makes Google
parse each cell the way typing it would — which turns a message beginning `=` into a live
formula authored by whoever filled in the form, and eats the leading `+` or `0` off a
phone number.

Without the variables, leads are still saved and still emailed — the row is skipped.

## 5. Assistant — Groq

1. Key from [console.groq.com/keys](https://console.groq.com/keys) → `GROQ_API_KEY`.
2. `GROQ_MODEL` is `openai/gpt-oss-120b`. **Check it is still offered** — Groq retires
   models, and a name that no longer exists returns a 400 that surfaces as "the assistant
   is unavailable". Their models list is the authority:

   ```sh
   curl -s https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer $GROQ_API_KEY" | grep '"id"'
   ```

   This has already happened once: the original `llama-3.3-70b-versatile` was withdrawn,
   and the symptom was a valid key that still produced an unavailable assistant.

The gpt-oss models reason before answering, and those tokens come out of the same
`max_tokens` budget as the reply — so `lib/ai/groq.ts` sends `reasoning_effort: "low"`,
which is the difference between roughly 450 and 1,500 characters of usable answer at the
same ceiling. It is sent only to models whose name contains `gpt-oss`, because Groq
rejects the parameter on models that do not support it.

Two things to check if you change the model: that the reply arrives in
`choices[0].message.content` rather than being wrapped, and that any reasoning is in a
separate field. `qwen/qwen3.6-27b` fails the second — it prints its `<think>` block into
the content, which would put raw chain-of-thought in front of a visitor.

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
| `app/actions.ts` | Booking and contact submissions. Saves, then emails and appends to the sheet. |
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
- **Self-serve password reset.** There is no emailed reset link. An administrator can set
  anybody's password from `/admin/users` — audited as `account.resetPassword`, because
  whoever runs it can sign in as that account afterwards — and the seed script resets an
  admin's. The emailed flow is what is missing, and it needs the mail sender above.
- **Pagination.** Every list is capped at 200 rows. That is a working queue, not a
  scaling decision — revisit when a table actually runs long.
