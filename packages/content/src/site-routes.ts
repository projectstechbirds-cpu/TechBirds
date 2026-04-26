/**
 * Route map for humans / SEO work — hosts match `SITE_URLS` and production DNS.
 *
 * | Host (subdomain) | App | Main routes |
 * |------------------|-----|-------------|
 * | techbirdsgroup.com, www | `apps/www` (Vite) | `/` home, `/work`, `/work/:slug`, `/services`, `/process`, `/ventures`, `/about`, `/careers`, `/contact` |
 * | blog.techbirdsgroup.com | `apps/blog` | `/` index, `/p/:slug` post, `/tag/:tag` |
 * | app.techbirdsgroup.com | `apps/app` | `/login`, `/dashboard`, `/punch`, `/leave`, `/feed`, `/payslips`, `/documents` |
 * | api.techbirdsgroup.com | `apps/api` (FastAPI) | `/docs`, `/openapi.json`, `/health`, … |
 */
export const marketingPaths = [
  "/",
  "/work",
  "/services",
  "/process",
  "/ventures",
  "/about",
  "/careers",
  "/contact",
] as const;

export const blogPaths = ["/", "/p/:slug", "/tag/:tag"] as const;

export const portalPaths = [
  "/login",
  "/dashboard",
  "/punch",
  "/leave",
  "/feed",
  "/payslips",
  "/documents",
] as const;
