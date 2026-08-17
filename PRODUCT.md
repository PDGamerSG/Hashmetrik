# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four audiences, all reached through the same sign-in. Derived from `docs/superpowers/specs/2026-08-02-full-product-model.md`, `lib/auth/dal.ts` and the route tree; not yet confirmed by the user.

- **Client** (`/dashboard/client/*`) — the marketing or founder contact at a company Hashmetrik works for. Signs in to see what is running, approve or send back deliverables, read the content calendar and the KPI reports. Visits in bursts, usually because something is waiting on them.
- **Registered user** (`/dashboard`) — signed up, not yet activated as a client. Books consultations, tracks their own enquiries, keeps their profile current.
- **Staff / team member** (`/team`) — an account manager or delivery person. Sees only the clients they own or are assigned to; works projects, milestones, deliverables, calendar entries and reports.
- **Administrator** (`/admin`) — runs the business: leads, consultations, client activation, users, team, projects, services, CMS, settings, the assistant. This is the surface someone keeps open all day.

## Product Purpose

The signed-in half of Hashmetrik's own site: a client portal and back office for a PR and digital-marketing agency in Hyderabad. It replaces the email-and-spreadsheet loop between agency and client — what is in progress, what needs approval, what was published, what it moved — with one place both sides read. Success is a client who can answer "where is my work" without emailing, and an admin who can clear the day's queue without leaving the app.

## Positioning

The agency's site and its operations are one codebase: the lead captured on the marketing page, the consultation booked from it, the client activated from that lead, and the projects delivered against it are the same records. No second SaaS, no CRM to reconcile against.

## Operating Context

- Delivery is link-based: deliverables are `http(s)` URLs pointing at wherever the team already works (Drive, Figma, Notion). No file uploads.
- Approval loop: staff submit → client approves or requests changes → comments carry the conversation.
- Reporting is KPI records entered per client, per service, per period — not automated syncing from ad platforms.
- Content calendar entries are planned, scheduled and published posts.
- The admin surface is a queue-clearing surface: leads and consultations arrive continuously.
- Desktop-first in practice for staff and admin; clients arrive on phones as often as laptops.

## Capabilities and Constraints

- Next.js 16 (Turbopack), React 19, Tailwind v4, Prisma 7 on Neon Postgres, hand-rolled `jose` sessions.
- Three root layouts: `app/(site)`, `app/(app)`, `app/(admin)`. `proxy.ts` authenticates; `lib/auth/dal.ts` authorises against the live user row on every gated page and server action.
- Suspended accounts land on `/suspended`, not `/login`.
- Not built, deliberately: file uploads, automated KPI sync, password reset, pagination, transactional email beyond the lead notification.
- Vocabulary the UI must keep: leads, consultations, clients, services, projects, milestones, deliverables, comments, content calendar, KPI records, notices.

## Brand Commitments

- Name **Hashmetrik**; mark at `public/logo-hm.png` — a warm near-black tile with a coral hash on it.
- The **public marketing site** (`app/(site)`) is out of scope for this redesign and must not change: its bone/ink editorial system stays exactly as it is.
- Brand colours as recorded in `app/globals.css`: coral `#f2564a`, gold `#f6cd63`, ink `#141312`, bone `#f7f5f0`. Confirmed from the mark itself.

## Evidence on Hand

- Real Neon database with seeded admin (`prisma/seed.ts`); real leads/consultations/projects models exercised end to end.
- No customer testimonials, benchmarks, pricing, or case studies exist in this repo. Future work must not invent them.
- `docs/backend-setup.md` and `docs/superpowers/specs/` are the authoritative product record.

## Product Principles

1. **The queue is the product.** Whatever is waiting on the person reading is the first thing they should see.
2. **Scope is a database question, not a UI one.** What a viewer may see is decided in the `where` clause; the interface never implies access it cannot grant.
3. **Two sides, one record.** Client and agency read the same project, milestone and deliverable — never divergent views of it.
4. **Working surfaces stay working.** No marketing motion, no intro, no chat bubble behind the sign-in.
5. **Say what the team says.** Deliverable, milestone, notice, lead — the app's words are the agency's words.

## Accessibility & Inclusion

No user-specific requirement has been established. The incumbent code holds itself to WCAG AA contrast and visible focus; future work should not regress that.
