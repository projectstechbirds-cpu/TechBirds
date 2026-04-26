/**
 * Team data for /about. Photos resolved client-side from /team/<slug>.webp;
 * fallback initials render until R2 assets land.
 */
export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  bio: string;
}

export const teamLeads: TeamMember[] = [
  {
    slug: "prudhviraju-penumatsa",
    name: "Prudhviraju Penumatsa",
    role: "Founder",
    bio: "Started TechBirds in 2021 after a decade across healthcare, fintech, and operations engineering.",
  },
];

export const milestones: { year: string; event: string }[] = [
  { year: "2021", event: "TechBirds Group founded in Hyderabad." },
  { year: "2022", event: "First hospital management system shipped to a multi-specialty hospital." },
  { year: "2023", event: "Avhita ECG goes commercial across India." },
  { year: "2024", event: "Multi-vendor delivery platform launched in 12 cities." },
  { year: "2025", event: "EDCPro adopted by six CROs across India and SEA." },
  { year: "2026", event: "Self-hosted platform migration; six live ventures, 30+ projects shipped." },
];
