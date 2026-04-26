/**
 * Stub journal entries shown in the homepage "From the journal" preview.
 * Replaced by live API data once Phase 3 (Blog CMS) is in.
 */
export interface JournalPreview {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingMinutes: number;
}

export const journalPreviews: JournalPreview[] = [
  {
    slug: "self-hosting-postgres-in-2026",
    title: "Self-hosting Postgres in 2026",
    excerpt: "Why we left a managed DB for a single $14 KVM, and what we'd do differently.",
    publishedAt: "2026-03-12",
    readingMinutes: 8,
  },
  {
    slug: "designing-for-ops-not-demos",
    title: "Designing for ops, not demos",
    excerpt: "Logs, metrics, and runbooks deserve the same care as the login screen.",
    publishedAt: "2026-02-04",
    readingMinutes: 6,
  },
  {
    slug: "fixed-price-engagements-actually-work",
    title: "Why fixed-price engagements actually work",
    excerpt: "Five years of evidence that 'we'll figure it out as we go' isn't friendlier — it's lazier.",
    publishedAt: "2026-01-20",
    readingMinutes: 5,
  },
];
