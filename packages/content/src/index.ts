import { SITE_URLS } from "./site-urls";

export { ventures, type Venture, type VentureStatus } from "./ventures";
export { services, findService, type Service } from "./services";
export { caseStudies, findCaseStudy, type CaseStudy } from "./case-studies";

export { SITE_URLS } from "./site-urls";
export { marketingPaths, blogPaths, portalPaths } from "./site-routes";
export { primaryNav, footerGroups, type NavLink } from "./nav";
export { portalNav, type PortalNavLink } from "./portal-nav";
export { industries } from "./industries";
export { studioStats, type StudioStat } from "./stats";
export { processSteps, type ProcessStep } from "./process";
export { principles, type Principle } from "./principles";
export { testimonials, type Testimonial } from "./testimonials";
export { faqs, type Faq } from "./faqs";
export { jobs, type Job, type JobLocation, type JobType } from "./jobs";
export { journalPreviews, type JournalPreview } from "./journal";
export { teamLeads, milestones, type TeamMember } from "./team";

export const siteContact = {
  emails: {
    info: "info@techbirdsgroup.com",
    founder: "prudhviraju.penumatsa@techbirdsgroup.com",
    hr: "hr@techbirdsgroup.com",
    noreply: "no-reply@techbirdsgroup.com",
  },
  social: {
    linkedin: "https://www.linkedin.com/company/techbirds-consulting/",
    twitter: "https://twitter.com/techbirdsgroup",
    instagram: "https://instagram.com/techbirdsgroup",
  },
  calendly: "https://calendly.com/techbirds/intro",
  founded: 2021,
  studio: {
    city: "Hyderabad",
    country: "India",
    /** Full postal address — Tagoor Building, Kukatpally. */
    address:
      "4th floor, Tagoor Building, Jai Bharat Nagar, Dharma Reddy Colony Phase I, Kukatpally, Hyderabad, Telangana 500085",
  },
} as const;

export const siteMeta = {
  brand: "TechBirds Group",
  tagline: "Software, shipped.",
  description:
    "A software studio. We design and build production software for healthcare, commerce, and operations teams. From Hyderabad. Since 2021.",
  baseUrl: SITE_URLS.marketing,
  blogUrl: SITE_URLS.blog,
  appUrl: SITE_URLS.app,
  apiUrl: SITE_URLS.api,
  ogImage: "/brand/og-default.png",
} as const;
