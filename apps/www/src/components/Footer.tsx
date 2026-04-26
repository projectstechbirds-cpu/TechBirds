import { Link } from "react-router-dom";
import { Container } from "@techbirds/ui-kit";
import { footerGroups, siteContact, siteMeta } from "@techbirds/content";

const contactGroup = {
  heading: "Contact",
  links: [
    { to: "/contact", label: "Talk to us" },
    { to: `mailto:${siteContact.emails.info}`, label: siteContact.emails.info },
    { to: `mailto:${siteContact.emails.hr}`, label: siteContact.emails.hr },
  ],
};

const allGroups = [...footerGroups, contactGroup];

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-2">
      <Container>
        <div className="grid gap-6 py-7 md:grid-cols-12 md:gap-8 md:py-8">
          <div className="md:col-span-5">
            <div className="text-title font-semibold">
              {siteMeta.brand.split(" ")[0]}
              <span className="text-accent-500">.</span>
            </div>
            <p className="mt-3 max-w-sm text-body text-ink-500">{siteMeta.description}</p>
            <p className="mt-3 max-w-sm text-body-sm leading-relaxed text-ink-400">
              {siteContact.studio.address}
            </p>
          </div>
          {allGroups.map((g) => (
            <div key={g.heading} className="md:col-span-2">
              <p className="text-eyebrow uppercase text-ink-300">{g.heading}</p>
              <ul className="mt-3 space-y-2">
                {g.links.map((l) => (
                  <li key={l.to}>
                    {l.to.startsWith("http") || l.to.startsWith("mailto") ? (
                      <a
                        href={l.to}
                        className="text-body-sm text-ink-700 hover:text-accent-500"
                        target={l.to.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link to={l.to} className="text-body-sm text-ink-700 hover:text-accent-500">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-start justify-between gap-3 border-t border-line py-5 md:flex-row md:items-center">
          <p className="text-body-sm text-ink-500">
            © {new Date().getFullYear()} {siteMeta.brand}. All rights reserved.
          </p>
          <p className="text-body-sm text-ink-500">{siteMeta.tagline}</p>
        </div>
      </Container>
    </footer>
  );
}
