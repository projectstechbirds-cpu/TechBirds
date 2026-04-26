import { Badge, Button, PageHero, Section, SectionHeader } from "@techbirds/ui-kit";
import { jobs, principles, siteContact, siteMeta } from "@techbirds/content";
import { Seo } from "@/components/Seo";

export default function Careers() {
  const open = jobs.filter((j) => j.open);

  return (
    <>
      <Seo
        title="Careers — TechBirds"
        description="Join a small team building production software."
        canonical={`${siteMeta.baseUrl}/careers`}
      />
      <PageHero
        eyebrow="Work with us"
        title="Careers."
        lead="We hire engineers, designers, and operators who care about the craft. Small team, deep ownership, fixed-price engagements with real deadlines."
        actions={
          <Button asChild size="lg">
            <a href={`mailto:${siteContact.emails.hr}`}>Email {siteContact.emails.hr}</a>
          </Button>
        }
      />

      <Section bordered>
        <SectionHeader
          eyebrow={open.length > 0 ? "Open roles" : "No open roles"}
          title={
            open.length > 0
              ? "We're hiring."
              : "Always open to a strong intro."
          }
          description={
            open.length > 0
              ? "Send a CV and a paragraph on what you've shipped. We reply to every application."
              : "We don't have postings live right now. If you'd be a fit for a future role, drop us a line — we keep great profiles on file."
          }
        />
        {open.length > 0 && (
          <ul className="mt-6 space-y-4">
            {open.map((j) => (
              <li
                key={j.slug}
                className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-title font-semibold text-ink-900">{j.title}</p>
                  <p className="mt-1 text-body-sm text-ink-500">{j.summary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{j.team}</Badge>
                  <Badge tone="neutral">{j.location}</Badge>
                  <Badge tone="accent">{j.type}</Badge>
                  <Button asChild size="sm" variant="outline">
                    <a href={`mailto:${siteContact.emails.hr}?subject=Application: ${j.title}`}>
                      Apply
                    </a>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section bordered tone="muted">
        <SectionHeader eyebrow="What we believe" title="How we work, what we hire for." />
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => (
            <div key={p.title} className="rounded-lg border border-line bg-paper p-5">
              <p className="text-title font-semibold text-ink-900">{p.title}</p>
              <p className="mt-2 text-body text-ink-500">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
