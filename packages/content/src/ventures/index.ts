/** Six ventures from §2.3 */
export type VentureStatus = "live" | "in_development";

export interface Venture {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: VentureStatus;
  domain?: string;
  accent: string;
}

export const ventures: Venture[] = [
  {
    slug: "hospverse",
    name: "Hospverse",
    tagline: "Hospital operating system.",
    description:
      "End-to-end software for clinics and hospitals — patient records, pharmacy, billing, and multi-location operations.",
    status: "in_development",
    domain: "hospverse.com",
    accent: "teal",
  },
  {
    slug: "avhita",
    name: "Avhita ECG",
    tagline: "12-lead ECG, on a phone.",
    description:
      "Portable ECG hardware + diagnostic app trusted by cardiologists for first-pass screening.",
    status: "live",
    domain: "avhita.com",
    accent: "teal",
  },
  {
    slug: "omaguva",
    name: "O Maguva",
    tagline: "Sarees, sourced from the loom.",
    description:
      "Direct-from-weaver saree marketplace with provenance, payments, and logistics built in.",
    status: "live",
    domain: "omaguva.com",
    accent: "navy-gold",
  },
  {
    slug: "mangome",
    name: "MangoMe",
    tagline: "Local services, on tap.",
    description: "Hyperlocal commerce platform connecting service providers with neighbourhoods.",
    status: "live",
    domain: "mangome.in",
    accent: "amber",
  },
  {
    slug: "edcpro",
    name: "EDCPro",
    tagline: "Clinical data capture, simplified.",
    description:
      "Electronic data capture for clinical trials — dynamic CRFs, e-signatures, CDISC export.",
    status: "live",
    domain: "edc.techbirdsgroup.com",
    accent: "emerald",
  },
  {
    slug: "cab-saas",
    name: "Cab Management SaaS",
    tagline: "Run a fleet from a phone.",
    description:
      "Dispatch, driver app, customer app, and billing for cab operators — multi-tenant SaaS.",
    status: "in_development",
    accent: "sky",
  },
];
