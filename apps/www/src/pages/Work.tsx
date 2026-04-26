import { Link } from "react-router-dom";
import { PageHero, Section, LinkCard } from "@techbirds/ui-kit";
import { caseStudies, siteMeta } from "@techbirds/content";
import { Seo } from "@/components/Seo";

export default function Work() {
  return (
    <>
      <Seo
        title="Work — TechBirds"
        description="Selected case studies from healthcare, commerce, and operations."
        canonical={`${siteMeta.baseUrl}/work`}
      />
      <PageHero
        eyebrow="Selected work"
        title="Things we shipped."
        lead="Case studies from healthcare, commerce, and operations. Each one is a system that runs in production, not a slide deck."
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {caseStudies.map((c) => (
            <LinkCard
              key={c.slug}
              asChild
              eyebrow={c.industry}
              title={c.title}
              body={c.outcome}
              meta={c.client}
              media={<div className="aspect-video w-full bg-paper-2" />}
            >
              <Link to={`/work/${c.slug}`} />
            </LinkCard>
          ))}
        </div>
        <p className="mt-6 text-body text-ink-500">
          Want a deeper look?{" "}
          <Link to="/contact" className="text-accent-600 underline hover:text-accent-500">
            Tell us about your project.
          </Link>
        </p>
      </Section>
    </>
  );
}
