import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button, Container, cn } from "@techbirds/ui-kit";
import { portalNav, siteMeta } from "@techbirds/content";
import { useAuth } from "@/auth/AuthContext";

export function Shell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink-900">
      <header className="sticky top-0 z-50 border-b border-line bg-paper/80 backdrop-blur">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link to="/dashboard" className="text-title font-semibold tracking-tight">
              {siteMeta.brand}
              <span className="text-accent-500">.</span> Portal
            </Link>
            <nav className="hidden items-center gap-7 md:flex">
              {portalNav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    cn(
                      "text-body-sm font-semibold transition-colors duration-2",
                      isActive ? "text-ink-900" : "text-ink-500 hover:text-ink-900",
                    )
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              {user && (
                <span className="text-body-sm text-ink-500" title={user.email}>
                  {user.full_name}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
            <button
              type="button"
              className="rounded-md border border-line p-2 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
          {open && (
            <div className="border-t border-line py-4 md:hidden">
              <ul className="flex flex-col gap-3">
                {portalNav.map((n) => (
                  <li key={n.to}>
                    <NavLink
                      to={n.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "block text-body-sm font-semibold",
                          isActive ? "text-ink-900" : "text-ink-500",
                        )
                      }
                    >
                      {n.label}
                    </NavLink>
                  </li>
                ))}
                <li className="pt-2">
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Sign out
                  </Button>
                </li>
              </ul>
            </div>
          )}
        </Container>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
