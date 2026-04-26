import { Link, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  PageHero,
  Section,
  SectionHeader,
  Quote,
  Prose,
} from "@techbirds/ui-kit";
import { caseStudies, findCaseStudy, siteMeta } from "@techbirds/content";
import { Seo } from "@/components/Seo";

export default function CaseStudy() {
  const { slug } = useParams();
  const study = slug ? findCaseStudy(slug) : undefined;

  if (!study) {
    return (
      <>
        <Seo title="Not found — TechBirds" noindex />
        <PageHero
          eyebrow="404"
          title="Case study not found."
          lead="The case study you were looking for doesn't exist."
          actions={
            <Button asChild>
              <Link to="/work">Back to work</Link>
            </Button>
          }
        />
      </>
    );
  }

  const related = caseStudies
    .filter((c) => c.slug !== study.slug && c.industry === study.industry)
    .slice(0, 3);

  return (
    <>
      <Seo
        title={`${study.title} — TechBirds`}
        description={study.outcome}
        canonical={`${siteMeta.baseUrl}/work/${study.slug}`}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: study.title,
          datePublished: study.publishedAt,
          author: { "@type": "Organization", name: siteMeta.brand },
          publisher: { "@type": "Organization", name: siteMeta.brand },
        }}
      />
      <PageHero
        eyebrow={study.industry}
        title={study.title}
        lead={study.outcome}
        meta={`Client: ${study.client} · Published ${new Date(study.publishedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {study.stack.map((s) => (
              <Badge key={s} tone="neutral">
                {s}
              </Badge>
            ))}
          </div>
        }
      />

      <Section bordered>
        <div className="aspect-video w-full rounded-xl border border-line bg-paper-2" />
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-8">
            <Prose>
              <h2>The problem</h2>
              <p>{study.problem}</p>
              <h2>Our approach</h2>
              <p>{study.approach}</p>
              <h2>Results</h2>
              <ul>
                {study.results.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Prose>
          </div>
          <aside className="md:col-span-4">
            <div className="sticky top-24 space-y-5">
              <div className="rounded-lg border border-line bg-paper-2 p-5">
                <p className="text-eyebrow uppercase text-ink-300">Industry</p>
                <p className="mt-1 text-body font-semibold text-ink-900">{study.industry}</p>
              </div>
              <div className="rounded-lg border border-line bg-paper-2 p-5">
                <p className="text-eyebrow uppercase text-ink-300">Stack</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {study.stack.map((s) => (
                    <Badge key={s} tone="neutral">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link to="/contact">Talk about a similar build</Link>
              </Button>
            </div>
          </aside>
        </div>
      </Section>

      {study.quote && (
        <Section bordered tone="muted">
          <div className="mx-auto max-w-3xl">
            <Quote quote={study.quote.text} author={study.quote.author} role={study.quote.role} />
          </div>
        </Section>
      )}

      {related.length > 0 && (
        <Section bordered>
          <SectionHeader eyebrow="More from this sector" title={`Other ${study.industry.toLowerCase()} work.`} />
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/work/${r.slug}`}
                className="group rounded-lg border border-line bg-paper p-5 transition-colors duration-2 hover:border-accent-500"
              >
                <p className="text-eyebrow uppercase text-ink-300">{r.industry}</p>
                <p className="mt-2 text-title font-semibold text-ink-900 group-hover:text-accent-600">
                  {r.title}
                </p>
                <p className="mt-2 text-body text-ink-500">{r.outcome}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
