import {
  Bell,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  ChartColumn,
  Gauge,
  Inbox,
  KeyRound,
  ListChecks,
  Milestone,
  Newspaper,
  PhoneCall,
  Signpost,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * The marks down the sidebar.
 *
 * The map is by href rather than by label: a label is copy and changes with
 * the wind, and two areas both have a section called Overview that should not
 * be drawn with the same mark — the client's is their whole dashboard, the
 * admin's is the agency's.
 *
 * ---------------------------------------------------------------------------
 * WHICH GLYPH, AND WHY THESE ONES
 *
 * The first set was picked for legibility and got legible-but-generic: five of
 * the twelve were the stock marks any dashboard ships with, three areas all
 * opened on the same `LayoutDashboard` square, and `FileText` — a page with
 * lines on it — was standing in for the whole public site. A rail whose marks
 * could be lifted onto somebody else's admin without anyone noticing is a rail
 * that is not doing the second half of its job, which is to be found by shape.
 *
 * Every mark here is now one of three things, and nothing else:
 *
 *   an instrument   — a surface you read a number off, or set one on
 *   a place         — a business, a shelf, a hall
 *   something moving through the board — a thing that lands, rings, or runs
 *
 * That is the same vocabulary the rest of this world is built from, so the rail
 * stops being a set of icons and becomes the board's index. Concretely:
 *
 * - Overview is a `Gauge`, not a grid of squares. The brand is *hash* plus
 *   *metrik* and the parent system takes everything structural from measuring
 *   instruments; the page that answers "what is going on" is the dial you read
 *   first. It is also the one mark that repeats across areas on purpose — each
 *   area's own instrument, never on screen at the same time as another.
 * - Calls ring. `PhoneCall` carries the two arcs; `Phone` is a handset sitting
 *   in its cradle, which is the state this page is never about.
 * - Projects are a `Milestone`: a marker post beside the work, which is exactly
 *   what a project is made of here — a run of milestones with dates on them.
 *   `FolderKanban` described where the records are filed, which is a fact about
 *   the database rather than about the work. `Route`, which this was for an
 *   afternoon, is the better metaphor and the worse glyph: two dots on a curve
 *   at seventeen pixels is the same texture as the sliders on Settings, and two
 *   rows of one rail should never be told apart by counting dots.
 * - Accounts are `KeyRound` — an account in this product *is* a sign-in, which
 *   is exactly what separates it from Clients (a business) and Staff (a
 *   colleague). `IdCard` said "person" a third time.
 * - Content is a `Newspaper`, because the thing it publishes to is printed
 *   matter: the public site is a serif on bone paper with column rules, and it
 *   is the one part of this product that has a masthead.
 * - Staff's own overview is `ListChecks`: their board is a queue of work with
 *   things ticked off it, which is a different question from the agency's dial.
 *
 * Weight and size are set at the call site (`components/app/nav-links.tsx`),
 * not here — this file only decides which glyph a route gets.
 */

const ICONS: Record<string, LucideIcon> = {
  /* The client's own pages. */
  "/dashboard": Gauge,
  "/dashboard/client": Briefcase,
  "/dashboard/client/calendar": CalendarDays,
  "/dashboard/client/reports": ChartColumn,
  "/dashboard/notifications": Bell,

  /* Staff. */
  "/team": ListChecks,
  "/team/projects": Milestone,
  "/team/calendar": CalendarDays,
  "/team/reports": ChartColumn,

  /* The agency's own board. */
  "/admin": Gauge,
  "/admin/leads": Inbox,
  "/admin/consultations": PhoneCall,
  "/admin/clients": Building2,
  "/admin/projects": Milestone,
  "/admin/team": Users,
  /* Accounts is every sign-in that exists, which is a different question from
     Clients (a business) and Staff (a colleague) — a key rather than another
     set of shoulders. */
  "/admin/users": KeyRound,
  "/admin/cms": Newspaper,
  "/admin/assistant": Bot,
  "/admin/settings": SlidersHorizontal,
};

/** A destination with no mark of its own still gets one, not a hole. */
export function iconFor(href: string): LucideIcon {
  return ICONS[href] ?? Signpost;
}
