import Image from "next/image";
import type { ComponentType } from "react";
import { ArrowUpRight, Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Facebook, Instagram, Linkedin, Youtube } from "@/components/site/brand-icons";
import { ActionLink } from "@/components/site/button";
import { SectionLink } from "@/components/site/section-link";
import { CopyButton, SaveContactButton, SharePageButton } from "@/components/links/links-actions";
import { CONTACT, SITE, SOCIALS } from "@/lib/content";

/**
 * /links — the sheet.
 *
 * A printed QR, a bio link and a business card all land here, so the page is
 * one thumb-width card: every channel a tappable row, nothing to read before
 * you can act. It earns its look from the site's own vocabulary — card stock,
 * hairlines, a coral edge at the head of the sheet and the tick rule running
 * down the inside, with each group labelled by how many readings it holds.
 */

type Channel = {
  /** The code this channel is filed under, shown at the end of the row. */
  code: string;
  label: string;
  /** The handle, number or address the row resolves to. */
  value: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
  external?: boolean;
  /** Present when the value is worth keeping, not only opening. */
  copyValue?: string;
};

const FOLLOW_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  IG: Instagram,
  LI: Linkedin,
  YT: Youtube,
  FB: Facebook,
};

/* Built from the list the masthead, footer and contact page already publish,
   so a changed handle is changed in exactly one place. */
const FOLLOW: Channel[] = SOCIALS.map((social) => ({
  code: social.code,
  label: social.label,
  value: social.handle,
  href: social.href,
  Icon: FOLLOW_ICONS[social.code],
  external: true,
}));

const REACH: Channel[] = [
  {
    code: "TEL",
    label: "Call the team",
    value: CONTACT.phoneDisplay,
    href: `tel:${CONTACT.phone}`,
    Icon: Phone,
    copyValue: CONTACT.phoneDisplay,
  },
  {
    code: "WA",
    label: "WhatsApp",
    value: CONTACT.phoneDisplay,
    href: CONTACT.whatsapp,
    Icon: MessageCircle,
    external: true,
  },
  {
    code: "MAIL",
    label: "Email us",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    Icon: Mail,
    copyValue: CONTACT.email,
  },
  {
    code: "ALT",
    label: "Alternate inbox",
    value: CONTACT.emailAlt,
    href: `mailto:${CONTACT.emailAlt}`,
    Icon: Mail,
    copyValue: CONTACT.emailAlt,
  },
  {
    code: "MAP",
    label: "Visit the studio",
    value: "Hayathnagar, Hyderabad",
    href: `https://www.google.com/maps?q=${CONTACT.mapQuery}`,
    Icon: MapPin,
    external: true,
  },
  {
    code: "WEB",
    label: "Website",
    value: "hashmetrik.com",
    href: "/",
    Icon: Globe,
  },
];

const PAGES = [
  { label: "Services", href: "/#services" },
  { label: "Who we help", href: "/#audiences" },
  { label: "Why us", href: "/#why" },
  { label: "Contact", href: "/contact" },
];

export function LinksHub() {
  return (
    <div className="relative overflow-hidden bg-bone">
      <div aria-hidden className="pointer-events-none absolute inset-0 grain text-ink" />

      {/* Tight to the masthead: the card is the page, and a band of empty
          paper above it only pushes the first tappable row down the screen. */}
      <div className="relative mx-auto w-full max-w-xl px-4 pt-5 pb-12 sm:px-6 md:pt-8 md:pb-16">
        <article className="rise overflow-hidden rounded-sheet border border-ash bg-bone-2">
          {/* The brand's colour as the edge of the sheet rather than a band
              across it — enough to mark the card, quiet enough to read past. */}
          <div aria-hidden className="h-1 bg-coral" />

          <p className="flex items-center justify-between gap-4 border-b border-ash px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.28em] text-slate sm:px-7">
            <span>All links</span>
            <span>Hyderabad, India</span>
          </p>

          <div className="relative px-5 pt-8 pb-9 pl-11 sm:px-7 sm:pt-10 sm:pl-16">
            {/* The tick rule, run down the inside edge so every row on the
                card registers against the same scale as the rest of the site. */}
            <div aria-hidden className="absolute inset-y-0 left-5 w-2 sm:left-7">
              <div className="absolute inset-y-0 left-0 w-px tick-rule text-ink" />
              <div className="absolute inset-y-0 left-0 w-2 tick-rule-major text-ink" />
            </div>

            <header>
              <Image
                src="/logo-hm.png"
                alt=""
                width={96}
                height={96}
                priority
                className="size-12 rounded-sheet object-cover"
              />
              <h1 className="mt-5 font-display text-4xl leading-none font-semibold tracking-[-0.04em]">
                HashMetrik
              </h1>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-coral">
                PR · Performance · SEO · Social
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate">
                {SITE.tagline} Every channel we actually answer, on one sheet.
              </p>
            </header>

            <div className="rise mt-7 flex flex-col gap-2.5" style={{ animationDelay: "80ms" }}>
              <ActionLink href="/book" className="h-14 w-full">
                Book a free consultation
              </ActionLink>
              {/* Tighter than the site's utility type: two of these have to
                  fit side by side inside a 360px card. */}
              <div className="grid grid-cols-2 gap-2.5">
                <SaveContactButton className="h-12 w-full gap-1.5 px-2 text-[10px] tracking-[0.14em]" />
                <SharePageButton className="h-12 w-full gap-1.5 px-2 text-[10px] tracking-[0.14em]" />
              </div>
            </div>

            <ChannelList title="Follow" channels={FOLLOW} delay={140} />
            <ChannelList title="Reach us" channels={REACH} delay={200} />

            <nav aria-label="Site" className="rise mt-9" style={{ animationDelay: "260ms" }}>
              <GroupLabel title="On the site" count={PAGES.length} />
              <ul className="mt-4 flex flex-wrap gap-2">
                {PAGES.map((page) => (
                  <li key={page.label}>
                    <SectionLink
                      href={page.href}
                      className="inline-flex h-10 items-center rounded-sheet border border-ash px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-slate transition-colors duration-300 hover:border-coral hover:text-coral"
                    >
                      {page.label}
                    </SectionLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <p className="flex items-center justify-between gap-4 border-t border-ash px-5 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-slate sm:px-7">
            <span className="tabular">{FOLLOW.length + REACH.length} channels</span>
            <span>Replies in 2 hrs</span>
          </p>
        </article>
      </div>
    </div>
  );
}

/** A group's name, its rule, and the count of readings filed under it. */
function GroupLabel({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.32em] text-slate">{title}</h2>
      <span aria-hidden className="h-px flex-1 bg-ash" />
      <span aria-hidden className="font-mono text-[10px] tabular text-slate/60">
        {String(count).padStart(2, "0")}
      </span>
    </div>
  );
}

function ChannelList({
  title,
  channels,
  delay,
}: {
  title: string;
  channels: Channel[];
  delay: number;
}) {
  return (
    <section className="rise mt-9" style={{ animationDelay: `${delay}ms` }}>
      <GroupLabel title={title} count={channels.length} />

      <ul className="mt-1">
        {channels.map((channel) => (
          <li key={channel.code} className="flex items-center gap-2 border-b border-ash last:border-b-0">
            <a
              href={channel.href}
              target={channel.external ? "_blank" : undefined}
              rel={channel.external ? "noreferrer" : undefined}
              className="group flex min-w-0 flex-1 items-center gap-3.5 py-3.5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-sheet border border-ash bg-bone text-slate transition-colors duration-300 group-hover:border-coral group-hover:text-coral">
                <channel.Icon className="size-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-display text-base leading-tight font-semibold tracking-[-0.02em] transition-colors duration-300 group-hover:text-coral">
                  {channel.label}
                </span>
                <span className="mt-1 block truncate font-mono text-[11px] tracking-[0.08em] tabular text-slate">
                  {channel.value}
                </span>
              </span>

              <span className="shrink-0 font-mono text-[10px] tracking-[0.22em] text-slate/60">
                {channel.code}
              </span>
              <ArrowUpRight
                aria-hidden
                className="size-4 shrink-0 text-slate transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>

            {/* The slot is held open on rows with nothing to copy, so every
                arrow in the stack lands on the same vertical. */}
            {channel.copyValue ? (
              <CopyButton
                value={channel.copyValue}
                label={channel.label}
                className="size-10 border-ash text-slate hover:border-coral hover:text-coral"
              />
            ) : (
              <span aria-hidden className="size-10 shrink-0" />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
