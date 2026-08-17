import type { Metadata } from "next";
import { LinksHub } from "@/components/links/links-hub";

export const metadata: Metadata = {
  title: "All our links",
  description:
    "Every way to reach Hashmetrik in one place: Instagram, LinkedIn, YouTube, Facebook, WhatsApp, phone, email and the studio address.",
  alternates: { canonical: "/links" },
  openGraph: {
    title: "Hashmetrik — all our links",
    description: "Follow us, message us, or book a free consultation.",
    url: "/links",
    images: ["/icon-512.png"],
  },
};

export default function LinksPage() {
  return <LinksHub />;
}
