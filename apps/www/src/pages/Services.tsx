import { Link } from "react-router-dom";
import { Button, PageHero, Section, SectionHeader } from "@techbirds/ui-kit";
import { faqs, services, siteMeta } from "@techbirds/content";
import { Seo } from "@/components/Seo";

export default function Services() {
  return (
    <>
      <Seo
        title="Services — TechBirds"
        description="Web apps, mobile apps, custom ERP, e-commerce, cloud, and AI."
        canonical={`${siteMeta.baseUrl}/services`}
      />
      <PageHero
        eyebrow="What we do"
        title="Services."
        lead="Six practices, one studio. We staff each engagement with the people who would have built it themselves."
        actions={
          <Button asChild size="lg">
            <Link to="/contact">Discuss your project</Link>
          </Button>
        }
      />

      <Section bordered>
        <div className="flex flex-col gap-8">
          {services.map((s) => (
            <article
              key={s.slug}
              id={s.slug}
              className="grid scroll-mt-24 gap-6 md:grid-cols-12"
            >
              <div className="md:col-span-4">
                <p className="text-eyebrow uppercase text-accent-600">{s.title}</p>
                <h2 className="mt-3 text-headline font-semibold text-ink-900">{s.description}</h2>
              </div>
              <div className="md:col-span-8">
                <p className="text-body-lg text-ink-700">{s.details}</p>
                <ul className="mt-5 grid gap-2 md:grid-cols-2">
                  {s.deliverables.map((d) => (
                    <li
                      key={d}
                      className="rounded-md border border-line bg-paper-2 px-4 py-3 text-body-sm text-ink-700"
                    >
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section bordered tone="muted">
        <SectionHeader eyebrow="Common questions" title="What clients usually ask first." />
        <dl className="mt-6 grid gap-6 md:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.question} className="rounded-lg border border-line bg-paper p-5">
              <dt className="text-title font-semibold text-ink-900">{f.question}</dt>
              <dd className="mt-2 text-body text-ink-500">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
