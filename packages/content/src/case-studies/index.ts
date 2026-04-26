/**
 * Case studies — single source of truth.
 *
 * Each entry powers the index card on /work AND the detail view at /work/:slug.
 * Add new entries here; pages compose them automatically.
 */
export interface CaseStudy {
  slug: string;
  title: string;
  client: string;
  industry: string;
  outcome: string;
  /** One-paragraph problem statement. */
  problem: string;
  /** One-paragraph approach summary. */
  approach: string;
  /** 3–6 bullet outcome list. */
  results: string[];
  /** Tech stack chips. */
  stack: string[];
  /** Optional pull-quote. */
  quote?: { text: string; author: string; role: string };
  /** Hero cover (R2 path; placeholder rendered until assets land). */
  cover: string;
  publishedAt: string;
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "hospverse-hospital-os",
    title: "An OS for a 200-bed hospital.",
    client: "Confidential — Hyderabad",
    industry: "Healthcare",
    outcome: "Patient throughput up 22%, billing cycle cut from 9 days to 2.",
    problem:
      "A multi-specialty hospital ran on six disconnected tools, three Excel sheets, and a WhatsApp group. Discharge billing took up to nine days; the front desk re-keyed every patient three times.",
    approach:
      "We mapped the actual patient journey, replaced the six tools with one operating system over four months, and trained 80 staff in cohorts of ten. We kept Tally for accounting and built an export instead of trying to replace it.",
    results: [
      "Patient throughput up 22% in the first quarter post-launch.",
      "Discharge billing cycle: 9 days → 2 days.",
      "Front-desk re-keying eliminated; one form per patient.",
      "99.95% uptime across the first 12 months.",
    ],
    stack: ["React", "FastAPI", "PostgreSQL", "Redis", "AWS"],
    quote: {
      text: "They shipped what others kept slide-decking. Six months in, the system is the way the hospital actually runs.",
      author: "Dr. Anil Reddy",
      role: "Medical Director",
    },
    cover: "/case-studies/hospverse.webp",
    publishedAt: "2025-09-12",
  },
  {
    slug: "common-delivery-logistics",
    title: "Multi-vendor delivery, in 90 days.",
    client: "Common Delivery",
    industry: "Logistics",
    outcome: "Live in 12 cities, 1,400 daily trips, 99.4% on-time.",
    problem:
      "An aggregator wanted to unify three city-level delivery brands under one operations layer without a six-month rewrite or a forced rebrand.",
    approach:
      "We built a routing core and a driver app in 90 days, then connected the three legacy back-offices through adapters rather than replacing them. Each brand kept its identity; ops became one team.",
    results: [
      "Launched in 12 cities within the first quarter.",
      "1,400 daily trips, 99.4% on-time delivery.",
      "Single ops console replaced three dashboards.",
      "Driver app rated 4.7/5 in field rollout.",
    ],
    stack: ["React Native", "Go", "PostgreSQL", "Redis", "Mapbox"],
    cover: "/case-studies/common-delivery.webp",
    publishedAt: "2025-06-04",
  },
  {
    slug: "edcpro-clinical-trials",
    title: "EDC for fast-moving CROs.",
    client: "EDCPro",
    industry: "Clinical research",
    outcome: "Trial setup time down from 8 weeks to 11 days.",
    problem:
      "Mid-size CROs needed an EDC platform that wasn't priced for pharma and didn't take a quarter to configure for a single study.",
    approach:
      "We designed a dynamic CRF builder that lets a study coordinator launch a trial without a developer, and shipped CDISC-compliant export from day one.",
    results: [
      "Trial setup time: 8 weeks → 11 days.",
      "21 CFR Part 11 compliance audit passed first attempt.",
      "Adopted by 6 CROs across India and SEA.",
      "CDISC SDTM export with one click.",
    ],
    stack: ["React", "FastAPI", "PostgreSQL", "Celery"],
    cover: "/case-studies/edcpro.webp",
    publishedAt: "2025-03-21",
  },
  {
    slug: "omaguva-direct-from-loom",
    title: "A saree marketplace built on trust.",
    client: "O Maguva",
    industry: "E-commerce",
    outcome: "180+ weavers onboarded, GMV doubling QoQ.",
    problem:
      "Handloom weavers have stories and lineage; mass marketplaces flatten both. The brand wanted provenance to be a first-class feature, not a footer link.",
    approach:
      "We built a weaver-first marketplace where every saree carries its loom, weaver, and village on the product page, with payments and logistics handled end-to-end.",
    results: [
      "180+ weavers onboarded across three states.",
      "GMV doubling quarter-over-quarter for four quarters.",
      "Average order value 3.2× industry baseline.",
      "Returns under 2% — provenance reduces buyer remorse.",
    ],
    stack: ["React", "Node.js", "PostgreSQL", "Razorpay", "Shiprocket"],
    cover: "/case-studies/omaguva.webp",
    publishedAt: "2024-11-30",
  },
  {
    slug: "avhita-ecg",
    title: "Cardiology in a pocket.",
    client: "Avhita",
    industry: "Medical devices",
    outcome: "FDA-class device shipped to 6 countries.",
    problem:
      "A portable ECG hardware team had a working device and a stack of regulatory docs, but no diagnostic app a cardiologist would actually trust at the bedside.",
    approach:
      "We designed and built the companion app with practising cardiologists in the room, and shipped the firmware-pairing flow that survived FDA review.",
    results: [
      "FDA-class device shipped commercially in 6 countries.",
      "Average pairing time: 11 seconds.",
      "Used by 400+ practitioners in the first year.",
      "Zero security findings in third-party penetration test.",
    ],
    stack: ["React Native", "BLE", "Python", "PostgreSQL"],
    cover: "/case-studies/avhita.webp",
    publishedAt: "2024-08-15",
  },
  {
    slug: "custom-erp-manufacturer",
    title: "Replacing five spreadsheets with one ERP.",
    client: "Confidential — Pune",
    industry: "Manufacturing",
    outcome: "Inventory accuracy up to 99.1%, monthly close in 2 days.",
    problem:
      "A 200-person specialty manufacturer ran finance on Tally, inventory on five Excel sheets, and production on a wall-mounted whiteboard. The monthly close took ten days.",
    approach:
      "We replaced the spreadsheets with a custom ERP, kept Tally for statutory accounting, and built shop-floor tablets with offline-first sync for production updates.",
    results: [
      "Inventory accuracy: 73% → 99.1%.",
      "Monthly close: 10 days → 2 days.",
      "Production whiteboard retired after 14 years.",
      "Cost recovery within the first 9 months.",
    ],
    stack: ["React", "FastAPI", "PostgreSQL", "PWA"],
    cover: "/case-studies/erp.webp",
    publishedAt: "2024-05-02",
  },
];

export const findCaseStudy = (slug: string): CaseStudy | undefined =>
  caseStudies.find((c) => c.slug === slug);
