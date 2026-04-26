import { Badge, Card, CardBody, CardTitle, PageHero, Section, SectionHeader } from "@techbirds/ui-kit";
import { siteMeta, ventures } from "@techbirds/content";
import { Seo } from "@/components/Seo";
import { ExternalLink } from "lucide-react";

export default function Ventures() {
  const live = ventures.filter((v) => v.status === "live");
  const upcoming = ventures.filter((v) => v.status !== "live");

  return (
    <>
      <Seo
        title="Ventures — TechBirds"
        description="Six products built and operated by the TechBirds team."
        canonical={`${siteMeta.baseUrl}/ventures`}
      />
      <PageHero
        eyebrow="Built by us"
        title="Ventures."
        lead="We don't just build for clients. Six products live in the wild — each one a long bet on a sector we know."
      />

      <Section bordered>
        <SectionHeader eyebrow="Live" title="Shipped and operating." />
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {live.map((v) => (
            <Card key={v.slug}>
              <div className="flex items-center justify-between">
                <CardTitle>{v.name}</CardTitle>
                <Badge tone="success">Live</Badge>
              </div>
              <p className="mt-2 text-body-sm text-ink-700">{v.tagline}</p>
              <CardBody className="mt-2 text-ink-500">{v.description}</CardBody>
              {v.domain && (
                <a
                  href={`https://${v.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-mono text-accent-600 hover:text-accent-500"
                >
                  {v.domain}
                  <ExternalLink size={14} />
                </a>
              )}
            </Card>
          ))}
        </div>
      </Section>

      {upcoming.length > 0 && (
        <Section bordered tone="muted">
          <SectionHeader eyebrow="In development" title="What's next from the studio." />
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((v) => (
              <Card key={v.slug}>
                <div className="flex items-center justify-between">
                  <CardTitle>{v.name}</CardTitle>
                  <Badge tone="warning">In dev</Badge>
                </div>
                <p className="mt-2 text-body-sm text-ink-700">{v.tagline}</p>
                <CardBody className="mt-2 text-ink-500">{v.description}</CardBody>
                {v.domain && <p className="mt-3 text-mono text-ink-300">{v.domain}</p>}
              </Card>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
