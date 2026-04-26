import { Container } from "@techbirds/ui-kit";
import { SITE_URLS, siteContact, siteMeta } from "@techbirds/content";

const footerExplore = [
  { href: SITE_URLS.marketing, label: "Marketing site" },
  { href: `${SITE_URLS.marketing}/work`, label: "Case studies" },
  { href: `${SITE_URLS.marketing}/careers`, label: "Careers" },
  { href: SITE_URLS.app, label: "Employee portal" },
  { href: `${SITE_URLS.api}/docs`, label: "API docs" },
  { href: `${SITE_URLS.api}/health`, label: "API health" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-2">
      <Container>
        <div className="grid gap-6 py-7 md:grid-cols-12 md:py-8">
          <div className="md:col-span-6">
            <p className="text-eyebrow uppercase text-ink-300">More from TechBirds</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {footerExplore.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-body-sm text-ink-700 hover:text-accent-500"
                    target={l.href.startsWith(SITE_URLS.marketing) ? undefined : "_blank"}
                    rel={l.href.startsWith(SITE_URLS.marketing) ? undefined : "noreferrer"}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-6 md:text-right">
            <p className="max-w-md text-body-sm leading-relaxed text-ink-400 md:ml-auto">
              {siteContact.studio.address}
            </p>
            <p className="mt-3 text-body-sm text-ink-500">
              © {new Date().getFullYear()} {siteMeta.brand}. Notes from the studio.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 md:justify-end">
              <a
                href={`mailto:${siteContact.emails.info}`}
                className="text-body-sm text-ink-500 hover:text-ink-900"
              >
                {siteContact.emails.info}
              </a>
              <a
                href={siteContact.social.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-body-sm text-ink-500 hover:text-ink-900"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
