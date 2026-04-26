import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Helmet } from "react-helmet-async";
import { siteMeta } from "@techbirds/content";
export function Seo({ title, description, canonical, ogImage, type = "website", jsonLd, noindex, }) {
    const fullTitle = title.endsWith(siteMeta.brand)
        ? title
        : `${title} | ${siteMeta.brand.split(" ")[0]}`;
    const desc = description ?? siteMeta.description;
    const image = ogImage ?? siteMeta.ogImage;
    return (_jsxs(Helmet, { children: [_jsx("title", { children: fullTitle }), _jsx("meta", { name: "description", content: desc }), canonical && _jsx("link", { rel: "canonical", href: canonical }), noindex && _jsx("meta", { name: "robots", content: "noindex,nofollow" }), _jsx("meta", { property: "og:title", content: fullTitle }), _jsx("meta", { property: "og:description", content: desc }), _jsx("meta", { property: "og:type", content: type }), _jsx("meta", { property: "og:image", content: image }), _jsx("meta", { property: "og:site_name", content: siteMeta.brand }), canonical && _jsx("meta", { property: "og:url", content: canonical }), _jsx("meta", { name: "twitter:card", content: "summary_large_image" }), _jsx("meta", { name: "twitter:title", content: fullTitle }), _jsx("meta", { name: "twitter:description", content: desc }), _jsx("meta", { name: "twitter:image", content: image }), jsonLd && (_jsx("script", { type: "application/ld+json", children: JSON.stringify(jsonLd) }))] }));
}
