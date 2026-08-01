# Backend Slice 1 — Leads, Assistant, Admin

*Design doc. 2 August 2026.*

## Context

The repository is a marketing site: homepage, `/book` (four-step funnel), `/contact`,
`/links`. Next.js 16.2.12, React 19.2.4, Tailwind v4, GSAP and Motion. There is no
database, no authentication and no API route.

Two seams were cut in the frontend and left deliberately unfinished:

- `app/actions.ts` — `submitLead()` validates and returns `{ ok }`, but `deliver()`
  only writes to the console.
- `components/site/assistant.tsx` — the chat panel is complete and calls
  `sendMessage()`, which throws `NOT_CONNECTED`.

The product plan behind this work covers seven phases: four role-based dashboards,
projects, deliverables, a content calendar, KPI analytics and a CMS. That is several
independent subsystems, so it is being built in slices. This document specifies the
first one.

## Scope

**In:** Postgres schema, lead persistence, lead notification email, a Groq-backed
assistant endpoint, admin credentials login, and an admin dashboard listing leads.

**Out, deferred to later slices:** client and team dashboards, projects, milestones,
deliverables, the content calendar, KPI records, the CMS, public self-signup, and the
notifications table.

Neither frontend contract changes. `submitLead()` keeps its signature and
`sendMessage()` keeps returning `Promise<string>`, so no component is rewritten.

## Decisions

**Sessions are hand-rolled, not Auth.js.** Next.js 16 deprecated `middleware.ts` in
favour of `proxy.ts`, and its own authentication guide documents the exact stack this
slice needs: a `jose`-signed cookie, bcrypt hashing and a data access layer. Auth.js v5
is still beta and its documented split assumes the deprecated file convention. One
credentials flow does not justify the dependency. Auth.js can replace this later if
OAuth is ever required.

**Prisma, not raw SQL.** No cloud credentials exist yet, so nothing runs end to end
during this build. Generated Prisma types are therefore the only compile-time check
available over query code, which is precisely when they are worth their weight. The
roadmap's fifteen models also want a schema as the single source of truth.

**Prisma 7 shape.** Prisma 7 dropped the Rust engine: it needs the `prisma-client`
generator with an explicit `output`, a `prisma.config.ts`, and the `@prisma/adapter-pg`
driver adapter. The connection string is a plain `DATABASE_URL`; Neon's pooled string is
ordinary Postgres, so no Neon-specific driver is introduced.

**The assistant does not stream.** The existing panel awaits a string. Streaming would
mean rewriting finished UI for no user-visible gain at this volume.

**Conversations are not logged.** Nothing in this slice would read them.

## Data model

Three models, in `prisma/schema.prisma`.

```
Admin    id, email @unique, passwordHash, createdAt
Lead     id, kind, name, email, phone, company, website, industry, service,
         budget, preferredDate, preferredTime, message,
         status @default("new"), notifiedAt?, createdAt   @@index([createdAt])
RateHit  id, key, window, count, createdAt                @@unique([key, window])
```

`Lead` mirrors the `Lead` type already declared in `app/actions.ts` field for field, so
`deliver()` becomes a single `prisma.lead.create`. `kind` is `booking | contact`;
`status` is `new | contacted | qualified | closed`. Both are strings rather than enums,
because changing a status vocabulary should not require a migration at this stage.

`RateHit` is the assistant's rate limiter: one row per IP per hour window. Serverless
instances do not share memory, so an in-process counter would not hold.

## Components

```
lib/db.ts                 PrismaClient singleton over PrismaPg
lib/auth/password.ts      bcryptjs hash / verify
lib/auth/session.ts       jose sign + verify, httpOnly cookie, 7-day expiry
lib/auth/dal.ts           verifySession() — React cache(), redirects on failure
lib/leads.ts              createLead, listLeads, setLeadStatus
lib/email.ts              Resend REST call over fetch, no SDK
lib/ai/prompt.ts          system prompt built from lib/content.ts
lib/ai/groq.ts            Groq chat completion over fetch
lib/rate-limit.ts         hourly per-key counter backed by RateHit
proxy.ts                  optimistic cookie-presence redirect
app/api/assistant/route.ts
app/admin/login/page.tsx  + login/logout server actions
app/admin/page.tsx        leads table, filters, status update action
prisma/seed.ts            creates the first admin from env
```

Every admin page and every admin server action calls `verifySession()` itself. `proxy.ts`
is a redirect convenience, never the security boundary — Next.js documents proxy checks
as optimistic only.

## Data flow

**Lead.** Form → `submitLead()` (existing validation) → `createLead()` writes the row →
`notifyTeam()` emails `info@hashmetrik.in`. A failed or unconfigured email never fails
the request: the lead is already durable, and only `notifiedAt` stays null. So the forms
work as soon as `DATABASE_URL` exists, with or without email.

**Assistant.** Panel → `POST /api/assistant` → shape validation → per-IP rate check →
Groq `/chat/completions` → `{ reply }`. A missing key returns 503, which the panel
already renders as its "not connected" notice.

**Admin.** `/admin/login` posts credentials to a server action → bcrypt compare →
session cookie → redirect to `/admin`. The failure message is identical for unknown
email and wrong password, so the form cannot be used to enumerate accounts.

## Error handling

- Lead write fails → `submitLead` returns its existing error copy; nothing is lost
  silently, the failure is logged server-side.
- Email fails → logged, lead retained, `notifiedAt` left null.
- Rate limit exceeded → 429 with a plain message.
- Groq errors or times out → 502; the panel shows its generic retry notice.
- Session invalid or expired → `verifySession()` redirects to `/admin/login`.
- Any missing environment variable degrades one feature, never the site.

## Testing

`node --test` with Node 24's native type stripping, so no test-runner dependency. Pure
logic only: lead normalisation and validation, rate-limit window arithmetic, session
encrypt/decrypt round trip and expiry, prompt construction, Groq response parsing.

Static verification: `prisma validate`, `prisma generate`, `tsc --noEmit`, `next build`.

**Known gap, accepted deliberately:** with no database URL available, the queries, the
login flow and the dashboard ship unexercised. `docs/backend-setup.md` records the exact
steps to bring them up, and the whole path can be exercised against a local Postgres
container in one command whenever that is wanted.

## Configuration

| Variable | Required for | Missing behaviour |
|---|---|---|
| `DATABASE_URL` | leads, admin, rate limit | leads fail with the form's error copy |
| `SESSION_SECRET` | admin login | login refuses to issue a session |
| `GROQ_API_KEY` | assistant | endpoint returns 503 |
| `GROQ_MODEL` | assistant | falls back to a documented default |
| `RESEND_API_KEY` | lead email | send skipped, lead still saved |
| `LEAD_NOTIFY_EMAIL` | lead email | falls back to `info@hashmetrik.in` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | seed script only | seed refuses to run |

`app/robots.ts` disallows `/admin`.
