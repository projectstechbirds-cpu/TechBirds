/**
 * Employee portal navigation. Single source of truth so the Shell, mobile
 * sheet, and dashboard tiles all stay aligned when we add new sections.
 */

export interface PortalNavLink {
  to: string;
  label: string;
  description: string;
}

export const portalNav: PortalNavLink[] = [
  { to: "/dashboard", label: "Dashboard", description: "Today at a glance." },
  { to: "/punch", label: "Punch", description: "Clock in and out, see your day." },
  { to: "/leave", label: "Leave", description: "Request leave, see your balance." },
  { to: "/feed", label: "Feed", description: "Updates from across the studio." },
  { to: "/payslips", label: "Payslips", description: "Download monthly payslips." },
  { to: "/documents", label: "Documents", description: "Letters, contracts, ID." },
];
