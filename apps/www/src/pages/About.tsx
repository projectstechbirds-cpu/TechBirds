import { Link } from "react-router-dom";
import {
  Button,
  PageHero,
  Section,
  SectionHeader,
  StatGrid,
  Quote,
} from "@techbirds/ui-kit";
import {
  milestones,
  principles,
  siteContact,
  siteMeta,
  studioStats,
  teamLeads,
  testimonials,
} from "@techbirds/content";
import { Seo } from "@/components/Seo";

export default function About() {
  return (
    <>
      <Seo
        title="About — TechBirds"
        description="A software studio from Hyderabad. Founded 2021."
        canonical={`${siteMeta.baseUrl}/about`}
      />
      <PageHero
        eyebrow="Who we are"
        title="A small studio. Big projects."
        lead={`Founded in ${siteContact.founded} in ${siteContact.studio.city}. We are engineers and designers who've shipped software at hospitals, banks, marketplaces, and labs.`}
        actions={
          <Button asChild size="lg">
            <Link to="/contact">Talk to us</Link>
          </Button>
        }
      />

      <Section bordered>
        <SectionHeader eyebrow="By the numbers" title="Five years. Real outcomes." />
        <div className="mt-6">
          <StatGrid stats={studioStats} />
        </div>
      </Section>

      <Section bordered tone="muted">
        <SectionHeader eyebrow="What we believe" title="Six principles." />
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => (
            <div key={p.title} className="rounded-lg border border-line bg-paper p-5">
              <p className="text-title font-semibold text-ink-900">{p.title}</p>
              <p className="mt-2 text-body text-ink-500">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section bordered>
        <SectionHeader eyebrow="The team" title="Who builds at TechBirds." />
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamLeads.map((m) => (
            <div key={m.slug} className="rounded-lg border border-line bg-paper p-5">
              <div className="aspect-square w-20 rounded-full bg-paper-3" aria-hidden />
              <p className="mt-4 text-title font-semibold text-ink-900">{m.name}</p>
              <p className="mt-1 text-eyebrow uppercase text-accent-600">{m.role}</p>
              <p className="mt-3 text-body text-ink-500">{m.bio}</p>
            </div>
          ))}
        </div>
        <p className="mt-7 text-body text-ink-500">
          And a small core team of engineers and designers who&rsquo;ve been building together
          since 2021.
        </p>
      </Section>

      <Section bordered tone="muted">
        <SectionHeader eyebrow="Timeline" title="How we got here." />
        <ol className="mt-6 space-y-4">
          {milestones.map((m) => (
            <li
              key={m.year}
              className="flex flex-col gap-1 rounded-lg border border-line bg-paper p-5 md:flex-row md:items-center md:gap-6"
            >
              <span className="text-mono text-accent-500 md:w-20">{m.year}</span>
              <span className="text-body text-ink-700">{m.event}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section bordered>
        <SectionHeader eyebrow="In their words" title="What clients tell us back." />
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Quote key={t.author} {...t} />
          ))}
        </div>
      </Section>
    </>
  );
}
