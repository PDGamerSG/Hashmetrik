import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { Audiences } from "@/components/home/audiences";
import { Services } from "@/components/home/services";
import { Why } from "@/components/home/why";
import { Faq } from "@/components/home/faq";
import { ContactBand } from "@/components/home/contact-band";
import { SectionScroll } from "@/components/site/section-link";
import { FAQS, SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "HashMetrik — PR & digital marketing agency in Hyderabad",
  description: SITE.description,
  alternates: { canonical: "/" },
};

/* The FAQ is the one block of copy worth exposing to search as structured
   data — these are the questions people actually type. */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function HomePage() {
  return (
    <>
      {/* Picks up a section chosen from another page, so those links land on
          the section without carrying a fragment into the URL. */}
      <SectionScroll />
      <Hero />
      <Audiences />
      <Services />
      <Why />
      <Faq />
      <ContactBand />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
