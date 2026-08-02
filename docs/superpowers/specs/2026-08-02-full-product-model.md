# The rest of the product — accounts, delivery, reporting, content

*Design doc. 2 August 2026. Follows `2026-08-02-backend-slice-1-design.md`.*

## Context

Slice 1 shipped leads, the assistant and an admin who could read them. The product plan
behind it covers seven phases; this document covers phases two to seven, built in one
pass because they share one data model and splitting a schema across six migrations
buys nothing when none of them is deployed yet.

The Neon database is real from this point on. Everything below has been run against it.

## Scope

**In:** accounts and roles with public signup, the consultation pipeline, client
onboarding, projects with milestones and deliverables, an approval loop, the content
calendar, KPI records and reporting, a CMS with public pages, settings and an audit
trail.

**Out:** file uploads, automated KPI syncing, transactional email beyond the lead
notification, password reset, pagination. Each is noted in `docs/backend-setup.md` with
the reason and the place it would go.

## Decisions

**`Admin` became `User`.** One table for all three roles: the login, the session and
the password are identical, and the differences are two columns and an optional profile
row. The migration copies the existing rows across before dropping `Admin`, preserving
ids — so live sessions kept working and nobody's password changed.

**Authorisation reads the database; the proxy only authenticates.** The obvious design
is a role claim in the JWT checked at the edge, and it is wrong here: an admin
activating a client changes what that client may see *now*, and a token says what was
true when it was signed. A newly activated client would be turned away from their own
dashboard until they signed out and back in. So `proxy.ts` answers "is anyone there?"
and `lib/auth/dal.ts` answers "may they?" against the live row, deduped per request by
React `cache()`. The cost is one indexed primary-key lookup per gated page.

This also fixes the case where a stale token is the *problem*: a cookie signed with a
rotated `SESSION_SECRET` used to satisfy the proxy's cookie-presence check, get bounced
back by the data access layer, and loop until the browser gave up. The proxy now
verifies the signature — `jose` needs no database — and clears a cookie that will never
verify again.

**Enums where a value is read by authorisation code, strings everywhere else.** `Role`
and `UserStatus` are Postgres enums: a typo there is a security bug and the database
should refuse it. Lead stages, project status, approval states and deliverable types are
strings, because that vocabulary belongs to the sales and delivery teams and renaming a
stage should not cost a migration.

**Scoping lives in the `where`.** Every query a client can reach takes a `clientId` and
puts it in the filter rather than fetching by id and checking ownership afterwards. The
check cannot then be forgotten, and someone else's row returns nothing — which is also
the right answer to give back.

**Deliverables are links, not uploads.** `fileUrl` points at wherever the team already
works. The scheme is validated (`http:`/`https:` only) because these links are rendered
for a client to click and `javascript:` parses as a URL too. Vercel Blob slots in behind
the same field when video storage is worth paying for.

**KPI upsert is find-then-write, not `upsert`.** The natural key includes a nullable
`serviceId` for overall metrics, and Postgres treats NULLs in a unique index as distinct
— so the constraint would not catch a duplicate and `upsert` could not target the
existing row. Matching explicitly behaves the same either way. The index stays as a
backstop for the rows that do have a service.

**CMS bodies are plain text.** Split on blank lines and rendered as text nodes. A
rich-text editor producing HTML that nobody sanitises is a cross-site scripting hole
with a toolbar on it, and the public pages do not need one.

**The audit log records access and money, not activity.** Activations, service
assignments, staff accounts, content and settings. A milestone ticked or a caption
rewritten is not logged, because a trail that records everything is one nobody reads.

## Data model

Fifteen models beyond Slice 1's three, in one migration
(`20260802120000_full_product_model`). `User` with `Role`/`UserStatus`; `TeamMember` and
`Client` as optional profiles on it; `Consultation` linking a `Lead` and a `User`;
`Service` / `ClientService`; `Project` / `Milestone` / `Deliverable` / `Comment`;
`ContentCalendarEntry`; `KPIRecord`; `CMSContent`; `Notification`; `Setting`;
`AuditLog`. `Lead` gained a nullable `userId`, so an enquiry and the account that later
signs up on the same address stop being two people.

## Areas

`/dashboard` for a registered user, `/dashboard/client/*` once activated, `/team` for
staff, `/admin` for administrators. Three root layouts: `(site)`, `(app)` and `(admin)`.
The admin keeps its own login page — it is linked from nowhere and says so on the form.

## Testing

`node --test` over pure logic, as before: session round trips and forgery, the gate's
routing table, lead and account validation, period arithmetic, slug normalisation,
rate-limit windows, Groq parsing. 69 tests.

The paths that need a database were exercised by a browser-driven pass against Neon —
47 checks across all four roles, including the ones worth naming: a newly activated
client reaching their dashboard on the same session, a team member seeing only their own
accounts, a client unable to see drafts, a `javascript:` link refused, and a forged
cookie landing on the login form rather than looping. `scripts/e2e-cleanup.ts` removes
what it creates.

**Known gap:** Groq and Resend have no keys, so the assistant is only confirmed to
return its 503 and the lead email only confirmed to be skipped.
