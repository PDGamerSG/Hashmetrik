import type { Role } from "./session";

/**
 * What each role may do, written down.
 *
 * This is documentation, not enforcement — the enforcement is `requireAdmin`,
 * `requireStaff` and `requireClient` in `dal.ts`, which read the live database
 * row on every gated page and every server action. The PRD asks for a "Roles &
 * Permissions" screen, and this is the honest version of one: a settings table
 * that could rewrite these rules would be a settings table that can grant itself
 * anything, and permissions that live in the database are permissions that can
 * be wrong in a way the code cannot see.
 *
 * Kept next to the guards it describes so that changing one puts the other in
 * the same diff. Free of `server-only` and Prisma: it is a list of sentences.
 */

export type RolePowers = {
  role: Role | "GUEST";
  label: string;
  can: readonly string[];
  cannot: readonly string[];
};

export const ROLE_POWERS: readonly RolePowers[] = [
  {
    role: "GUEST",
    label: "Guest",
    can: [
      "Read every public page",
      "Ask the growth assistant, within an hourly cap",
      "Send an enquiry and book a consultation",
    ],
    cannot: ["Reach anything under /dashboard, /team or /admin"],
  },
  {
    role: "REGISTERED_USER",
    label: "Registered user",
    can: [
      "Edit their own profile and business details",
      "Request consultations and read their history",
      "Read their own notifications",
    ],
    cannot: [
      "See projects, deliverables or reports until an admin activates them",
      "See any other account's data",
    ],
  },
  {
    role: "REGISTERED_USER",
    label: "Client (an activated registered user)",
    can: [
      "Everything a registered user can",
      "See their own services, projects, milestones and deliverables",
      "Approve or request changes on deliverables and calendar posts",
      "Read their own KPI reports",
    ],
    cannot: [
      "See a deliverable the team has not submitted",
      "See another client's anything — every query is scoped by their client id",
    ],
  },
  {
    role: "TEAM_MEMBER",
    label: "Team member",
    can: [
      "See the clients they are the account manager for",
      "Open projects, add milestones and upload deliverables",
      "Build and edit the content calendar",
      "Record KPI numbers",
    ],
    cannot: [
      "Reach /admin at all",
      "Create accounts, change roles, activate or suspend anybody",
    ],
  },
  {
    role: "ADMIN",
    label: "Administrator",
    can: [
      "Everything a team member can, across every client",
      "Create, edit, suspend and re-role any account",
      "Activate a registered user into a client and assign services and a manager",
      "Govern projects, the CRM pipeline, the CMS, the assistant and settings",
    ],
    cannot: [
      "Change their own role or suspend themselves",
      "Suspend or demote the last administrator who can still sign in",
      "Read anybody's password — they are bcrypt hashes and nothing reads them back",
    ],
  },
];
