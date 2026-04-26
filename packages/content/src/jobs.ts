export type JobLocation = "Hyderabad" | "Remote" | "Hybrid";
export type JobType = "Full-time" | "Contract" | "Internship";

export interface Job {
  slug: string;
  title: string;
  location: JobLocation;
  type: JobType;
  team: string;
  summary: string;
  open: boolean;
}

/**
 * Currently no open roles — set `open: true` to surface a posting on /careers.
 * Phase 2 ships the careers page; Phase 3+ may add a CMS-backed jobs board.
 */
export const jobs: Job[] = [
  {
    slug: "senior-fullstack",
    title: "Senior Full-stack Engineer",
    location: "Hyderabad",
    type: "Full-time",
    team: "Studio",
    summary:
      "Lead 1–2 client engagements end-to-end. TypeScript + React on the front, Python on the back.",
    open: false,
  },
  {
    slug: "product-designer",
    title: "Product Designer",
    location: "Hyderabad",
    type: "Full-time",
    team: "Studio",
    summary: "Design production software with engineers in the room. Figma, prototypes, real users.",
    open: false,
  },
];
