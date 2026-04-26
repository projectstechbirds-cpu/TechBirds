import { NavLink } from "react-router-dom";
import { Container, cn } from "@techbirds/ui-kit";
import { SITE_URLS, siteMeta } from "@techbirds/content";

const studioLinks = [
  { href: `${SITE_URLS.marketing}/work`, label: "Work" },
  { href: `${SITE_URLS.marketing}/services`, label: "Services" },
  { href: `${SITE_URLS.marketing}/contact`, label: "Contact" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/80 backdrop-blur">
      <Container>
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "text-title font-semibold tracking-tight",
                isActive ? "text-ink-900" : "text-ink-700 hover:text-ink-900",
              )
            }
          >
            {siteMeta.brand}
            <span className="text-accent-500">.</span> Journal
          </NavLink>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {studioLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-body-sm font-semibold text-ink-500 transition-colors duration-2 hover:text-ink-900"
              >
                {l.label}
              </a>
            ))}
            <a
              href={SITE_URLS.app}
              className="text-body-sm font-semibold text-ink-500 transition-colors duration-2 hover:text-ink-900"
            >
              Portal
            </a>
            <a
              href={SITE_URLS.marketing}
              className="text-body-sm font-semibold text-ink-500 transition-colors duration-2 hover:text-ink-900"
            >
              Studio site
            </a>
          </nav>
        </div>
      </Container>
    </header>
  );
}
