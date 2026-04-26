import { Helmet } from "react-helmet-async";
import { siteMeta } from "@techbirds/content";

interface SeoProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article";
  publishedAt?: string | null;
  jsonLd?: Record<string, unknown>;
}

export function Seo({
  title,
  description,
  canonical,
  image,
  type = "website",
  publishedAt,
  jsonLd,
}: SeoProps) {
  const fullTitle =
    title.endsWith("Journal") || title.includes(siteMeta.brand)
      ? title
      : `${title} | ${siteMeta.brand} Journal`;
  const img = image ?? `${siteMeta.baseUrl}${siteMeta.ogImage}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
