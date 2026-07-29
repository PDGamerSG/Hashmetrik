import { CONTACT, SITE, SOCIALS } from "@/lib/content";
import { ActionLink } from "./button";
import { SectionLink } from "./section-link";

const COMPANY = [
  { label: "Services", href: "/#services" },
  { label: "Who we help", href: "/#audiences" },
  { label: "Why us", href: "/#why" },
  { label: "Contact", href: "/contact" },
  { label: "All links", href: "/links" },
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
      <div aria-hidden className="pointer-events-none absolute inset-0 grain text-bone" />

      <div className="shell relative pt-20 pb-10 md:pt-28">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_repeat(3,minmax(0,0.9fr))]">
          <div>
            <p className="font-display text-3xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance md:text-4xl">
              {SITE.tagline}
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-bone/60">
              A Hyderabad-based PR and digital marketing agency, working with brands that would
              rather read the numbers than guess at them.
            </p>
            <ActionLink href="/book" variant="gold" className="mt-7">
              Book a free consultation
            </ActionLink>
          </div>

          <FooterColumn title="Company">
            {COMPANY.map((item) => (
              <li key={item.label}>
                <SectionLink href={item.href} className="transition-colors hover:text-coral">
                  {item.label}
                </SectionLink>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Services">
            {SERVICE_LINKS.map((label) => (
              <li key={label}>
                <SectionLink href="/#services" className="transition-colors hover:text-coral">
                  {label}
                </SectionLink>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Reach us">
            <li>
              <a href={`mailto:${CONTACT.email}`} className="transition-colors hover:text-coral">
                {CONTACT.email}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.emailAlt}`} className="transition-colors hover:text-coral">
                {CONTACT.emailAlt}
              </a>
            </li>
            <li>
              <a href={`tel:${CONTACT.phone}`} className="transition-colors hover:text-coral">
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
              className="group inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.22em] text-bone/55 transition-colors hover:text-coral"
            >
              <span className="text-bone/30 transition-colors group-hover:text-coral">
                {s.code}
              </span>{" "}
              {s.handle}
            </a>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 font-mono text-[11px] tracking-[0.18em] text-bone/40 sm:flex-row sm:items-center sm:justify-between">
          <p className="uppercase">© {new Date().getFullYear()} HashMetrik</p>
          <p className="uppercase">Hyderabad, India · 17.33°N 78.60°E</p>
        </div>
      </div>

      {/* The wordmark, set once at full width and cropped by the viewport —
          the sign-off, and the only place the name is allowed to be this big. */}
      <div aria-hidden className="relative select-none px-4 pb-2 md:px-8">
        <p className="w-full text-center font-display text-[19vw] leading-[0.78] font-semibold tracking-[-0.055em] text-bone/[0.07]">
          HashMetrik
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
      <h2 className="font-mono text-[11px] uppercase tracking-[0.28em] text-bone/40">{title}</h2>
      <ul className="mt-3 text-sm text-bone/80 [&_a]:block [&_a]:py-2">{children}</ul>
    </div>
  );
}
