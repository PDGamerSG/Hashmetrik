import { CONTACT, SITE, SOCIALS } from "@/lib/content";
import { ActionLink } from "./button";
import { MarkField } from "./mark-field";
import { SectionLink } from "./section-link";

const COMPANY = [
  { label: "Services", href: "/#services" },
  { label: "Who we help", href: "/#audiences" },
  { label: "Why us", href: "/#why" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
  { label: "All links", href: "/links" },
];

/**
 * The way in to the signed-in side.
 *
 * Set apart from the marketing columns because it answers a different question
 * — these are for people who are already customers, not people deciding to be.
 * Both are plain links for the reason given in `masthead.tsx`: the footer is on
 * every statically rendered page, and reading the session to relabel them would
 * make the whole site dynamic. `/login` and `/signup` each redirect a visitor
 * who already has a session to their own home.
 */
const ACCOUNT = [
  { label: "Sign in", href: "/login" },
  { label: "Create an account", href: "/signup" },
];

const SERVICE_LINKS = [
  "PR & reputation",
  "Influencer marketing",
  "Performance marketing",
  "SEO",
  "Website development",
  "Social media",
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-bone">
      <MarkField className="pointer-events-none absolute inset-0 text-bone" />

      <div className="shell relative pt-20 pb-10 md:pt-28">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_repeat(3,minmax(0,0.9fr))]">
          <div>
            <p className="font-display text-3xl leading-[1.08] font-medium tracking-[-0.018em] text-balance md:text-4xl">
              {SITE.tagline}
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-bone/60">
              A Hyderabad-based PR and digital marketing agency, working with brands that would
              rather read the numbers than guess at them.
            </p>
            <ActionLink href="/book" variant="gold" className="mt-7">
              Book a free consultation
            </ActionLink>

            {/* Under the call to action rather than in a column of its own: the
                grid is built for three link columns, and a fourth would squeeze
                all of them to add two entries. It reads correctly here anyway —
                the CTA is for someone deciding, this is for someone who already
                decided. */}
            <ul className="mt-8 flex flex-wrap items-center gap-x-6 label text-bone/45">
              {ACCOUNT.map((item) => (
                <li key={item.label}>
                  <SectionLink
                    href={item.href}
                    className="inline-flex min-h-11 items-center transition-colors hover:text-coral active:text-coral"
                  >
                    {item.label}
                  </SectionLink>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn title="Company">
            {COMPANY.map((item) => (
              <li key={item.label}>
                <SectionLink href={item.href} className="transition-colors hover:text-coral active:text-coral">
                  {item.label}
                </SectionLink>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Services">
            {SERVICE_LINKS.map((label) => (
              <li key={label}>
                <SectionLink href="/#services" className="transition-colors hover:text-coral active:text-coral">
                  {label}
                </SectionLink>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Reach us">
            <li>
              <a href={`mailto:${CONTACT.email}`} className="transition-colors hover:text-coral active:text-coral">
                {CONTACT.email}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.emailAlt}`} className="transition-colors hover:text-coral active:text-coral">
                {CONTACT.emailAlt}
              </a>
            </li>
            <li>
              <a href={`tel:${CONTACT.phone}`} className="transition-colors hover:text-coral active:text-coral">
                {CONTACT.phoneDisplay}
              </a>
            </li>
            <li className="pt-2 leading-relaxed text-bone/45">
              {CONTACT.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </li>
          </FooterColumn>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-1 border-t border-ash-ink pt-4">
          {SOCIALS.map((s) => (
            <a
              key={s.code}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              /* `gap` rather than a space between the two spans: a flex
                 container drops a whitespace-only child, so the code and the
                 handle were being printed as one word. */
              className="group inline-flex min-h-11 items-center gap-1.5 label text-bone/55 transition-colors hover:text-coral active:text-coral"
            >
              <span className="text-bone/30 transition-colors group-hover:text-coral group-active:text-coral">
                {s.code}
              </span>
              {s.handle}
            </a>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 label text-bone/40 sm:flex-row sm:items-center sm:justify-between">
          <p className="uppercase">© {new Date().getFullYear()} Hashmetrik</p>
          <p className="uppercase">Hyderabad, India · 17.33°N 78.60°E</p>
        </div>
      </div>

      {/* The wordmark, set once at full width and cropped by the viewport —
          the sign-off, and the only place the name is allowed to be this big. */}
      <div aria-hidden className="relative select-none px-4 pb-2 md:px-8">
        <p className="w-full text-center font-display text-[19vw] leading-[0.84] font-medium tracking-[-0.03em] text-bone/[0.07]">
          Hashmetrik
        </p>
      </div>
    </footer>
  );
}

/**
 * A footer column.
 *
 * The links are laid out as blocks with their own padding rather than as lines
 * of text with margins between them. Set as inline text at this size a row is
 * about 17px tall, which is under the 24px a pointer of "coarse" accuracy is
 * assumed to have — two adjacent entries in a list of six are then one
 * mis-tap apart. The padding replaces the gap, so the column is no taller than
 * it was; the target is simply the whole row rather than the glyphs.
 */
function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="label text-bone/40">{title}</h2>
      <ul className="mt-3 text-sm text-bone/80 [&_a]:block [&_a]:py-2">{children}</ul>
    </div>
  );
}
