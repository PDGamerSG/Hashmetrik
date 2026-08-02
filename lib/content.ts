/**
 * Every piece of site copy and contact detail lives here.
 * One file to edit when the agency changes a number, an address or a claim —
 * the components below only ever render what they are handed.
 */

export const SITE = {
  name: "HashMetrik",
  url: "https://hashmetrik.com",
  tagline: "Everything your brand needs. One growth partner.",
  description:
    "HashMetrik is a Hyderabad-based growth partner. Brand foundation, digital presence, marketing growth and brand reach — built as one customised package and reported as one set of numbers.",
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
  { label: "The package", href: "/#package" },
  { label: "Services", href: "/#services" },
  { label: "Who we help", href: "/#audiences" },
  { label: "Why us", href: "/#why" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
] as const;

/**
 * The growth package, as four pillars.
 *
 * This is the homepage's central claim — that the agency is bought as one
 * partner rather than as six retainers — so the four pillars are the spine of
 * the page rather than another card grid. `reading` is the pillar's position
 * on the tick rule; `code` is the reading that pillar is judged on, the same
 * convention the services list already uses.
 */
export const PILLARS = [
  {
    id: "foundation",
    reading: "01",
    code: "IDENTITY",
    name: "Brand Foundation",
    claim: "Decide what the brand is before spending a rupee telling anyone.",
    items: [
      "Brand Strategy",
      "Brand Positioning",
      "Logo Design",
      "Tagline Creation",
      "Brand Identity",
      "Brand Guidelines",
    ],
    image: "/pillars/foundation.webp",
    video: "/pillars/foundation.mp4",
    imageAlt: "Logo studies, torn colour swatches and a type specimen laid out on a studio desk",
  },
  {
    id: "presence",
    reading: "02",
    code: "CVR",
    name: "Digital Presence",
    claim: "The place every campaign sends people, built to convert them.",
    items: ["Website Development", "Landing Pages", "UI/UX Design", "Website Optimization"],
    image: "/pillars/presence.webp",
    video: "/pillars/presence.mp4",
    imageAlt: "A designer reviewing website wireframes on a large display, the same layouts marked up on paper beside the keyboard",
  },
  {
    id: "growth",
    reading: "03",
    code: "ROAS",
    name: "Marketing Growth",
    claim: "Demand, generated and measured on the same dashboard.",
    items: [
      "Social Media Management",
      "SEO",
      "Performance Marketing",
      "Content Marketing",
      "Email Marketing",
    ],
    image: "/pillars/growth.webp",
    video: "/pillars/growth.mp4",
    imageAlt: "A media buyer reading campaign dashboards at a two-monitor desk, the printed weekly report beside them",
  },
  {
    id: "reach",
    reading: "04",
    code: "SOV",
    name: "Brand Reach",
    claim: "Everywhere the brand should be seen that you cannot simply buy.",
    items: ["PR Management", "Influencer Marketing", "Google Business Profile", "Analytics"],
    image: "/pillars/reach.webp",
    video: "/pillars/reach.mp4",
    imageAlt: "A founder mid-answer to camera, boom microphone overhead and a softbox out of focus in the foreground",
  },
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
    image: "/audiences/restaurants.webp",
  },
  {
    title: "Healthcare & clinics",
    problem: "Patient acquisition and reputation, handled carefully.",
    image: "/audiences/healthcare.webp",
  },
  {
    title: "Real estate",
    problem: "High-intent pipelines that actually reach site visits.",
    image: "/audiences/real-estate.webp",
  },
  {
    title: "Startups",
    problem: "Launch traction and an investor-ready narrative.",
    image: "/audiences/startups.webp",
  },
  {
    title: "Ecommerce brands",
    problem: "Scaling spend without giving back the margin.",
    image: "/audiences/ecommerce.webp",
  },
  {
    title: "Fashion & jewellery",
    problem: "Aspirational pull that converts into demand.",
    image: "/audiences/fashion.webp",
  },
  {
    title: "B2B companies",
    problem: "Qualified pipeline, not a bigger list of names.",
    image: "/audiences/b2b.webp",
  },
  {
    title: "Personal brands",
    problem: "Authority, press and an audience that compounds.",
    image: "/audiences/personal-brands.webp",
  },
] as const;

/**
 * `code` is the reading each service is measured by — it labels the row.
 * `image` is only ever shown under the pointer, one at a time, so these are
 * chosen to read at thumbnail size rather than to be studied.
 */
export const SERVICES = [
  {
    id: "pr",
    code: "SOV",
    name: "PR & reputation",
    problem: "Invisible brand, no media presence, crisis handled reactively.",
    outcomes: ["Tier-1 media coverage", "Reputation monitoring", "Crisis playbooks"],
    image: "/services/pr.webp",
  },
  {
    id: "influencer",
    code: "REACH",
    name: "Influencer marketing",
    problem: "Low organic reach and a trust gap with new audiences.",
    outcomes: ["Curated creator partnerships", "Campaign-led launches", "Performance reporting"],
    image: "/services/influencer.webp",
  },
  {
    id: "performance",
    code: "ROAS",
    name: "Performance marketing",
    problem: "High acquisition cost, leaky funnels, untracked spend.",
    outcomes: ["Google, Meta and YouTube ads", "Funnel and landing-page CRO", "Profitable, reported ROAS"],
    image: "/services/performance.webp",
  },
  {
    id: "seo",
    code: "RANK",
    name: "SEO",
    problem: "Absent from search exactly where the intent lives.",
    outcomes: ["Technical and local SEO", "Content engines", "Compounding organic traffic"],
    image: "/services/seo.webp",
  },
  {
    id: "website",
    code: "CVR",
    name: "Website development",
    problem: "Slow, off-brand sites that lose the visitor before the pitch.",
    outcomes: ["Conversion-first builds", "Sub-2s page loads", "Analytics wired in from day one"],
    image: "/services/website.webp",
  },
  {
    id: "social",
    code: "ENG",
    name: "Social media",
    problem: "Inconsistent posting, no strategy, no community.",
    outcomes: ["Content systems", "Community management", "Always-on calendars"],
    image: "/services/social.webp",
  },
] as const;

/**
 * The consultation, as the visitor actually experiences it.
 *
 * The hero panel is the only place these three beats are set out in order —
 * the FAQ states them in prose and the booking page assumes them. `unit` is
 * the reading each beat is measured in, the same convention the pillars and
 * the services list already use.
 */
export const INTAKE = [
  {
    reading: "00",
    name: "The call",
    unit: "30 min",
    note: "Thirty minutes with a senior strategist. No deck, no pitch team.",
  },
  {
    reading: "01",
    name: "Growth thesis",
    unit: "48 hrs",
    note: "A written plan for your business — sent whether or not you hire us.",
  },
  {
    reading: "02",
    name: "Milestones",
    unit: "Week 1",
    note: "Targets agreed in week one, so there is something to check against.",
  },
] as const;

/**
 * Studio hours in IST, as day numbers from Sunday. The hero panel reads these
 * to say whether anyone is actually in, and to offer the next bookable slot
 * out of `TIME_SLOTS` — so a change here moves both.
 */
export const STUDIO_DAYS = [1, 2, 3, 4, 5] as const;

/**
 * Why the practice is shaped the way it is.
 *
 * `code` is the same convention the pillars and the services already use: the
 * one word this claim is actually about, set as a reading. Four bare titles in
 * a row read as a values page; four titles filed under PLAN, TEAM, AUDIT and
 * FIT read as a specification, which is the register the rest of the site is
 * written in.
 */
export const REASONS = [
  {
    code: "PLAN",
    title: "Strategy before spend",
    desc: "Every engagement opens with a written plan built around your business model, margin and stage — not a channel we happen to like.",
  },
  {
    code: "TEAM",
    title: "Founder-led, start to finish",
    desc: "You work with the senior strategists who pitched you. No handover to a junior pod after the contract is signed.",
  },
  {
    code: "AUDIT",
    title: "Reporting you can audit",
    desc: "One dashboard, the same definitions every month, and the losses reported as plainly as the wins.",
  },
  {
    code: "FIT",
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
