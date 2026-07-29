"use client";

import { useState } from "react";
import { Check, Copy, Share2, UserRoundPlus } from "lucide-react";
import { ActionButton } from "@/components/site/button";
import { CONTACT, SITE } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The three interactive controls on /links.
 *
 * They are split out of the sheet so the rest of the page — the directory
 * itself, which is the whole point of a QR landing — stays server-rendered
 * and ships no JavaScript to read.
 */

const VCARD = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "N:;HashMetrik;;;",
  "FN:HashMetrik",
  "ORG:HashMetrik",
  "TITLE:PR & Digital Marketing Agency",
  `TEL;TYPE=WORK,VOICE:${CONTACT.phone}`,
  `EMAIL;TYPE=WORK:${CONTACT.email}`,
  `EMAIL;TYPE=WORK:${CONTACT.emailAlt}`,
  `URL:${SITE.url}`,
  "ADR;TYPE=WORK:;;Flat 501 Shakuntala Residency Anand Nagar Hayathnagar;Hyderabad;Telangana;501505;India",
  "END:VCARD",
].join("\r\n");

/** Copies a value and reports it for two seconds, the length of a glance. */
function useCopy() {
  const [copied, setCopied] = useState(false);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard unavailable — every value on this page is also a link. */
    }
  }

  return { copied, copy };
}

export function SaveContactButton({ className }: { className?: string }) {
  function save() {
    const blob = new Blob([VCARD], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hashmetrik.vcf";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ActionButton type="button" onClick={save} variant="outline" arrow={false} className={className}>
      <UserRoundPlus aria-hidden className="size-4" />
      Save contact
    </ActionButton>
  );
}

export function SharePageButton({ className }: { className?: string }) {
  const { copied, copy } = useCopy();

  async function share() {
    const url = `${SITE.url}/links`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: SITE.name, text: SITE.tagline, url });
        return;
      } catch {
        /* Dismissed — fall through to copying the link. */
      }
    }
    copy(url);
  }

  return (
    <ActionButton
      type="button"
      onClick={share}
      variant="outline"
      arrow={false}
      className={className}
    >
      {copied ? (
        <>
          <Check aria-hidden className="size-4" />
          Link copied
        </>
      ) : (
        <>
          <Share2 aria-hidden className="size-4" />
          Share page
        </>
      )}
    </ActionButton>
  );
}

/** The square that sits at the end of a row whose value is worth keeping. */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const { copied, copy } = useCopy();

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className={cn(
        "grid size-11 shrink-0 place-items-center self-center rounded-sheet border transition-colors duration-300",
        className,
      )}
    >
      <span className="sr-only" aria-live="polite">
        {copied ? `${label} copied` : `Copy ${label}`}
      </span>
      {copied ? (
        <Check aria-hidden className="size-4 text-gold" />
      ) : (
        <Copy aria-hidden className="size-4" />
      )}
    </button>
  );
}
