import { Link } from "react-router-dom";
import { Button, PageHero, Section, SectionHeader } from "@techbirds/ui-kit";
import { principles, processSteps, siteMeta } from "@techbirds/content";
import { Seo } from "@/components/Seo";

export default function Process() {
  return (
    <>
      <Seo
        title="Process — TechBirds"
        description="How we work: discover, define, design, build, ship, run."
        canonical={`${siteMeta.baseUrl}/process`}
      />
      <PageHero
        eyebrow="How we work"
        title="Process."
        lead="Six steps from first conversation to a system in production. No moving targets, no ambiguous line items."
      />

      <Section bordered>
        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {processSteps.map((s) => (
            <li key={s.number} className="rounded-lg border border-line bg-paper p-5">
              <p className="text-mono text-accent-500">{s.number}</p>
              <p className="mt-2 text-title font-semibold text-ink-900">{s.title}</p>
              <p className="mt-2 text-body text-ink-500">{s.body}</p>
              <p className="mt-3 text-eyebrow uppercase text-ink-300">{s.duration}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section bordered tone="muted">
        <SectionHeader
          eyebrow="What we believe"
          title="Six principles that shape every engagement."
        />
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => (
            <div key={p.title} className="rounded-lg border border-line bg-paper p-5">
              <p className="text-title font-semibold text-ink-900">{p.title}</p>
              <p className="mt-2 text-body text-ink-500">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section padding="lg">
        <div className="rounded-xl border border-line bg-paper-2 p-8 md:p-10">
          <h2 className="text-display-md text-ink-900">Ready to start?</h2>
          <p className="mt-3 max-w-xl text-body-lg text-ink-500">
            Discovery week kicks off within ten business days of a signed engagement.
          </p>
          <div className="mt-7">
            <Button asChild size="lg">
              <Link to="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
