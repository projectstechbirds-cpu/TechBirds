import { Link } from "react-router-dom";
import {
  Button,
  PageHero,
  Section,
  SectionHeader,
  LogoCloud,
  Marquee,
  StatGrid,
  LinkCard,
  Quote,
  Card,
  CardTitle,
  CardBody,
  Badge,
} from "@techbirds/ui-kit";
import {
  caseStudies,
  industries,
  journalPreviews,
  processSteps,
  services,
  siteMeta,
  studioStats,
  testimonials,
  ventures,
} from "@techbirds/content";
import { Seo } from "@/components/Seo";

export default function Home() {
  return (
    <>
      <Seo
        title={`${siteMeta.brand} — ${siteMeta.tagline}`}
        description={siteMeta.description}
        canonical={`${siteMeta.baseUrl}/`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: siteMeta.brand,
          url: siteMeta.baseUrl,
          foundingDate: "2021",
          slogan: siteMeta.tagline,
        }}
      />

      <PageHero
        eyebrow={`${siteMeta.brand} — A software studio`}
        title={siteMeta.tagline}
        lead={siteMeta.description}
        actions={
          <>
            <Button asChild size="lg">
              <Link to="/work">See our work</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Talk to us</Link>
            </Button>
          </>
        }
        aside={<div className="aspect-square w-full rounded-xl border border-line bg-paper-2" />}
      />

      <Section bordered padding="sm">
        <LogoCloud label="Trusted by teams in" items={industries} />
      </Section>

      <Section bordered padding="sm" tone="muted" contained={false}>
        <Marquee
          items={caseStudies.map((c) => (
            <Link
              key={c.slug}
              to={`/work/${c.slug}`}
              className="text-title font-semibold text-ink-700 hover:text-accent-500"
            >
              {c.title}
              <span className="ml-3 text-eyebrow uppercase text-ink-300">{c.industry}</span>
            </Link>
          ))}
        />
      </Section>

      <Section bordered>
        <SectionHeader
          eyebrow="What we do"
          title="Six practices, one studio."
          description="Each engagement is staffed with the people who would have built it themselves."
        />
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <LinkCard
              key={s.slug}
              asChild
              eyebrow="Service"
              title={s.title}
              body={s.description}
            >
              <Link to={`/services#${s.slug}`} />
            </LinkCard>
          ))}
        </div>
      </Section>

      <Section bordered tone="muted">
        <SectionHeader
          eyebrow="How we work"
          title="From first conversation to production."
          description="Six steps. No ambiguity. No moving targets."
        />
        <ol className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      <Section bordered>
        <SectionHeader
          eyebrow="Built by us"
          title="Six ventures, in production."
          description="We don't just build for clients. Some products we ship, run, and operate ourselves."
        />
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ventures.map((v) => (
            <Card key={v.slug}>
              <div className="flex items-center justify-between">
                <CardTitle>{v.name}</CardTitle>
                <Badge tone={v.status === "live" ? "success" : "warning"}>
                  {v.status === "live" ? "Live" : "In dev"}
                </Badge>
              </div>
              <p className="mt-2 text-body-sm text-ink-700">{v.tagline}</p>
              <CardBody className="mt-2 text-ink-500">{v.description}</CardBody>
              {v.domain && <p className="mt-3 text-mono text-ink-300">{v.domain}</p>}
            </Card>
          ))}
        </div>
        <div className="mt-7">
          <Button asChild variant="outline">
            <Link to="/ventures">All ventures →</Link>
          </Button>
        </div>
      </Section>

      <Section bordered tone="muted">
        <SectionHeader
          eyebrow="By the numbers"
          title="Five years. Real outcomes."
          description="What we've shipped, and how it ran in production."
        />
        <div className="mt-6">
          <StatGrid stats={studioStats} />
        </div>
      </Section>

      <Section bordered>
        <SectionHeader
          eyebrow="In their words"
          title="What clients tell us back."
        />
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Quote key={t.author} {...t} />
          ))}
        </div>
      </Section>

      <Section bordered tone="muted">
        <SectionHeader
          eyebrow="From the journal"
          title="Notes from the studio."
          description="Engineering decisions, design notes, and stories from inside our work."
        />
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {journalPreviews.map((p) => (
            <LinkCard
              key={p.slug}
              href={`${siteMeta.blogUrl}/p/${p.slug}`}
              eyebrow={`${new Date(p.publishedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} · ${p.readingMinutes} min`}
              title={p.title}
              body={p.excerpt}
            />
          ))}
        </div>
        <div className="mt-7">
          <Button asChild variant="outline">
            <a href={siteMeta.blogUrl} target="_blank" rel="noreferrer">
              Read the journal →
            </a>
          </Button>
        </div>
      </Section>

      <Section padding="lg">
        <div className="rounded-xl border border-line bg-paper-2 p-8 md:p-10">
          <p className="text-eyebrow uppercase text-accent-600">Ready when you are</p>
          <h2 className="mt-3 text-display-md text-ink-900 md:text-display-lg">
            Tell us about your project.
          </h2>
          <p className="mt-4 max-w-xl text-body-lg text-ink-500">
            We reply within one business day. No sales funnel, no boilerplate — a real engineer
            reads every enquiry.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/contact">Start a project</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/work">See what we've shipped</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
