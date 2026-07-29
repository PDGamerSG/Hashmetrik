/**
 * Every piece of site copy and contact detail lives here.
 * One file to edit when the agency changes a number, an address or a claim —
 * the components below only ever render what they are handed.
 */

export const SITE = {
  name: "HashMetrik",
  url: "https://hashmetrik.com",
  tagline: "Measurable growth. Not guesswork.",
  description:
    "HashMetrik is a Hyderabad-based PR and digital marketing agency. We build the strategy, run the campaigns and report the numbers that move revenue.",
} as const;

export const CONTACT = {
  phone: "+919505070701",
  phoneDisplay: "+91 95050 70701",
  email: "info@hashmetrik.in",
  emailAlt: "hashmetrik@gmail.com",
  whatsapp: "https://wa.me/919505070701",
  addressLines: [
    "Flat 501, Shakuntala Residency",
    "Anand Nagar, Hayathnagar",
    "Hyderabad, Telangana — 501505",
  ],
  mapQuery:
    "Shakuntala+Residency,+Anand+Nagar,+Hayathnagar,+Hyderabad,+Telangana+501505",
} as const;

export const SOCIALS = [
  { code: "IG", label: "Instagram", handle: "@hashmetrik", href: "https://www.instagram.com/hashmetrik/" },
  { code: "LI", label: "LinkedIn", handle: "/company/hash-metrik", href: "https://www.linkedin.com/company/hash-metrik/" },
  { code: "YT", label: "YouTube", handle: "@hashmetrik", href: "https://youtube.com/@hashmetrik?si=2B5vnwknXWZCygyA" },
  { code: "FB", label: "Facebook", handle: "/hashmetrik", href: "https://www.facebook.com/share/1HW6VMsBoQ/?mibextid=wwXIfr" },
] as const;

export const NAV = [
  { label: "Services", href: "/#services" },
  { label: "Who we help", href: "/#audiences" },
  { label: "Why us", href: "/#why" },
  { label: "Links", href: "/links" },
  { label: "Contact", href: "/contact" },
] as const;

/**
 * The metrics tape. These are the readings a client actually gets billed
 * against, so the marquee is the agency's own vocabulary rather than filler.
 */
export const METRICS = [
  "ROAS",
  "CPL",
  "CAC",
  "CTR",
  "SOV",
  "AOV",
  "LTV",
  "CVR",
  "IMPRESSIONS",
  "QUALIFIED PIPELINE",
  "SHARE OF SEARCH",
] as const;

export const AUDIENCES = [
  {
    title: "Restaurants & cafés",
    problem: "Empty weekday seats and weak local discovery.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Healthcare & clinics",
    problem: "Patient acquisition and reputation, handled carefully.",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Real estate",
    problem: "High-intent pipelines that actually reach site visits.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Startups",
    problem: "Launch traction and an investor-ready narrative.",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Ecommerce brands",
    problem: "Scaling spend without giving back the margin.",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Fashion & jewellery",
    problem: "Aspirational pull that converts into demand.",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "B2B companies",
    problem: "Qualified pipeline, not a bigger list of names.",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Personal brands",
    problem: "Authority, press and an audience that compounds.",
    image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=900&q=80",
  },
] as const;

/** `code` is the reading each service is measured by — it labels the card. */
export const SERVICES = [
  {
    id: "pr",
    code: "SOV",
    name: "PR & reputation",
    problem: "Invisible brand, no media presence, crisis handled reactively.",
    outcomes: ["Tier-1 media coverage", "Reputation monitoring", "Crisis playbooks"],
  },
  {
    id: "influencer",
    code: "REACH",
    name: "Influencer marketing",
    problem: "Low organic reach and a trust gap with new audiences.",
    outcomes: ["Curated creator partnerships", "Campaign-led launches", "Performance reporting"],
  },
  {
    id: "performance",
    code: "ROAS",
    name: "Performance marketing",
    problem: "High acquisition cost, leaky funnels, untracked spend.",
    outcomes: ["Google, Meta and YouTube ads", "Funnel and landing-page CRO", "Profitable, reported ROAS"],
  },
  {
    id: "seo",
    code: "RANK",
    name: "SEO",
    problem: "Absent from search exactly where the intent lives.",
    outcomes: ["Technical and local SEO", "Content engines", "Compounding organic traffic"],
  },
  {
    id: "website",
    code: "CVR",
    name: "Website development",
    problem: "Slow, off-brand sites that lose the visitor before the pitch.",
    outcomes: ["Conversion-first builds", "Sub-2s page loads", "Analytics wired in from day one"],
  },
  {
    id: "social",
    code: "ENG",
    name: "Social media",
    problem: "Inconsistent posting, no strategy, no community.",
    outcomes: ["Content systems", "Community management", "Always-on calendars"],
  },
] as const;

export const REASONS = [
  {
    title: "Strategy before spend",
    desc: "Every engagement opens with a written plan built around your business model, margin and stage — not a channel we happen to like.",
  },
  {
    title: "Founder-led, start to finish",
    desc: "You work with the senior strategists who pitched you. No handover to a junior pod after the contract is signed.",
  },
  {
    title: "Reporting you can audit",
    desc: "One dashboard, the same definitions every month, and the losses reported as plainly as the wins.",
  },
  {
    title: "Plans sized to your stage",
    desc: "No templated retainer. We pick the mix of channels, creative and pace that suits where the business actually is.",
  },
] as const;

export const FAQS = [
  {
    q: "What does HashMetrik actually do?",
    a: "PR and reputation, influencer marketing, performance marketing across Google, Meta and YouTube, SEO, conversion-focused websites, and social media — run as one system rather than six disconnected retainers.",
  },
  {
    q: "How quickly will I see results?",
    a: "Performance marketing and PR usually show movement in two to four weeks. SEO and brand work compound over three to six months. We set milestone targets in week one so you can see progress against them either way.",
  },
  {
    q: "Do you work outside Hyderabad?",
    a: "Yes. We are based in Hyderabad and work with brands across India, the GCC, the US and the UK. Engagements are remote-first, with onsite sprints when a launch calls for it.",
  },
  {
    q: "What budget do I need?",
    a: "Focused service lines start around ₹1L a month and scale with ambition and media spend. We size the right shape together on the consultation call — before any contract.",
  },
  {
    q: "How does the consultation work?",
    a: "Pick a service, choose a slot and share a short brief. You get 30 minutes with a senior strategist, plus a written growth thesis within 48 hours. There is no obligation attached to it.",
  },
  {
    q: "Why choose HashMetrik over a larger agency?",
    a: "Senior people on your account, reporting you can check line by line, and a refusal to confuse activity with impact.",
  },
] as const;

export const BOOKING_SERVICES = SERVICES.map((s) => ({
  id: s.id,
  name: s.name,
  code: s.code,
  desc: s.problem,
}));

export const TIME_SLOTS = [
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
] as const;

export const BUDGET_RANGES = [
  "Under ₹1L",
  "₹1L – ₹3L",
  "₹3L – ₹10L",
  "₹10L – ₹25L",
  "₹25L+",
] as const;
