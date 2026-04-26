/**
 * Six services from §2.2.
 *
 * `description` powers the home grid card; `details` and `deliverables` power
 * the dedicated /services page. Add new services here — pages reflow automatically.
 */
export interface Service {
  slug: string;
  title: string;
  description: string;
  /** lucide-react icon name. */
  icon: string;
  details: string;
  deliverables: string[];
}

export const services: Service[] = [
  {
    slug: "web",
    title: "Web Apps",
    description: "Production web platforms — SPAs, dashboards, marketplaces — built to scale.",
    icon: "globe",
    details:
      "From internal admin tools to public-facing marketplaces. We pick boring frameworks and spend the novelty budget on the product.",
    deliverables: [
      "Architecture document and stack decision record",
      "Component library tied to your design system",
      "CI/CD pipeline with preview environments",
      "Production deployment with observability baked in",
    ],
  },
  {
    slug: "mobile",
    title: "Mobile Apps",
    description: "iOS, Android, and React Native apps with offline-first sync.",
    icon: "smartphone",
    details:
      "We default to React Native unless the product needs platform-specific affordances. Offline-first sync is a feature, not an afterthought.",
    deliverables: [
      "Single codebase for iOS and Android (or native when warranted)",
      "Offline-first sync with conflict resolution",
      "Crash reporting and analytics wired from day one",
      "TestFlight + Play internal track distribution",
    ],
  },
  {
    slug: "erp",
    title: "Custom ERP",
    description: "Operations software shaped to your business — finance, inventory, HR.",
    icon: "layers",
    details:
      "Off-the-shelf ERPs force you to change. Custom ERPs change with you. We build the modules you actually need and skip the ones you don't.",
    deliverables: [
      "Process map of your current operations",
      "Modular system: finance, inventory, HR, production",
      "Tally / SAP / legacy integrations via clean adapters",
      "Role-based access and audit log on every mutation",
    ],
  },
  {
    slug: "ecom",
    title: "E-Commerce",
    description: "Custom storefronts with payment gateways, inventory, and admin tools.",
    icon: "shopping-bag",
    details:
      "Shopify is great until it isn't. We build custom commerce when the product or operations demand it — marketplaces, bespoke checkout, deep inventory.",
    deliverables: [
      "Customer storefront with SEO-grade rendering",
      "Admin console with order, inventory, and payout flows",
      "Razorpay / Stripe / direct bank integration",
      "Shipping aggregator integration (Shiprocket / Delhivery)",
    ],
  },
  {
    slug: "cloud",
    title: "Cloud & DevOps",
    description: "AWS, Azure, GCP — migration, CI/CD, observability, and cost control.",
    icon: "cloud",
    details:
      "We migrate workloads, fix bills, and set up the boring infrastructure (CI, monitoring, on-call) that good engineering depends on.",
    deliverables: [
      "Cost-optimised cloud architecture",
      "GitHub Actions / GitLab CI pipelines",
      "Centralised logging and metrics dashboards",
      "Runbooks and on-call rotation setup",
    ],
  },
  {
    slug: "ai",
    title: "AI & Data",
    description: "Pragmatic ML — search, classification, and assistants in production.",
    icon: "sparkles",
    details:
      "We don't do research; we ship the boring 80%: extraction, classification, search, copilot integrations. Real users, real data, real KPIs.",
    deliverables: [
      "Use-case scoping — what's worth doing with ML at all",
      "Data pipeline and labelling workflow",
      "Model evaluation harness, not just accuracy claims",
      "Production deployment with feedback loop",
    ],
  },
];

export const findService = (slug: string): Service | undefined =>
  services.find((s) => s.slug === slug);
