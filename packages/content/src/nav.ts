import { SITE_URLS } from "./site-urls";

/** Single source of truth for marketing-site nav. */
export interface NavLink {
  to: string;
  label: string;
}

/** Top header — every primary marketing route except home (logo). */
export const primaryNav: NavLink[] = [
  { to: "/work", label: "Work" },
  { to: "/services", label: "Services" },
  { to: "/process", label: "Process" },
  { to: "/ventures", label: "Ventures" },
  { to: "/about", label: "About" },
  { to: "/careers", label: "Careers" },
  { to: "/contact", label: "Contact" },
];

/**
 * Footer columns for the marketing site (www).
 * Internal `to` paths are relative to the marketing origin.
 */
export const footerGroups: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Explore",
    links: [
      { to: "/work", label: "Work" },
      { to: "/services", label: "Services" },
      { to: "/process", label: "Process" },
      { to: "/ventures", label: "Ventures" },
      { to: "/about", label: "About" },
      { to: "/careers", label: "Careers" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Products & APIs",
    links: [
      { to: SITE_URLS.marketing, label: "Marketing site" },
      { to: SITE_URLS.blog, label: "Journal (blog)" },
      { to: SITE_URLS.app, label: "Employee portal" },
      { to: `${SITE_URLS.api}/docs`, label: "API (OpenAPI)" },
      { to: `${SITE_URLS.api}/health`, label: "API health" },
      { to: "https://status.techbirdsgroup.com", label: "Status page" },
    ],
  },
];
