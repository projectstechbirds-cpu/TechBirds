import { Helmet } from "react-helmet-async";
import { siteMeta } from "@techbirds/content";

interface SeoProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  /** "website" (default), "article", "profile". */
  type?: "website" | "article" | "profile";
  /** Optional JSON-LD structured data. */
  jsonLd?: Record<string, unknown>;
  /** Pass true to keep robots from indexing (e.g. preview routes). */
  noindex?: boolean;
}

export function Seo({
  title,
  description,
  canonical,
  ogImage,
  type = "website",
  jsonLd,
  noindex,
}: SeoProps) {
  const fullTitle = title.endsWith(siteMeta.brand)
    ? title
    : `${title} | ${siteMeta.brand.split(" ")[0]}`;
  const desc = description ?? siteMeta.description;
  const image = ogImage ?? siteMeta.ogImage;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteMeta.brand} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
