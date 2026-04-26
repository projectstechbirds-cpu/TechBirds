import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Container, cn, Button } from "@techbirds/ui-kit";
import { primaryNav, siteMeta } from "@techbirds/content";
import { Menu, X } from "lucide-react";

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-title font-semibold tracking-tight">
            {siteMeta.brand.split(" ")[0]}
            <span className="text-accent-500">.</span>
          </Link>
          <nav className="hidden flex-wrap items-center justify-end gap-x-3 gap-y-2 md:flex lg:gap-x-4 xl:gap-x-5">
            {primaryNav.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "text-body-sm font-semibold transition-colors duration-2",
                    isActive ? "text-ink-900" : "text-ink-500 hover:text-ink-900",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden md:block">
            <Button asChild size="sm">
              <Link to="/contact">Talk to us</Link>
            </Button>
          </div>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-700 hover:bg-paper-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {open && (
          <nav className="flex flex-col gap-2 border-t border-line py-4 md:hidden">
            {primaryNav.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-body-sm font-semibold transition-colors duration-2",
                    isActive ? "bg-paper-2 text-ink-900" : "text-ink-500 hover:bg-paper-2",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Button asChild size="sm" className="mt-2 self-start">
              <Link to="/contact" onClick={() => setOpen(false)}>
                Talk to us
              </Link>
            </Button>
          </nav>
        )}
      </Container>
    </header>
  );
}
