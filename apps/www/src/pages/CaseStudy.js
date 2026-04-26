import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, PageHero, Section, SectionHeader, Quote, Prose, } from "@techbirds/ui-kit";
import { caseStudies, findCaseStudy, siteMeta } from "@techbirds/content";
import { Seo } from "@/components/Seo";
export default function CaseStudy() {
    const { slug } = useParams();
    const study = slug ? findCaseStudy(slug) : undefined;
    if (!study) {
        return (_jsxs(_Fragment, { children: [_jsx(Seo, { title: "Not found \u2014 TechBirds", noindex: true }), _jsx(PageHero, { eyebrow: "404", title: "Case study not found.", lead: "The case study you were looking for doesn't exist.", actions: _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/work", children: "Back to work" }) }) })] }));
    }
    const related = caseStudies
        .filter((c) => c.slug !== study.slug && c.industry === study.industry)
        .slice(0, 3);
    return (_jsxs(_Fragment, { children: [_jsx(Seo, { title: `${study.title} — TechBirds`, description: study.outcome, canonical: `${siteMeta.baseUrl}/work/${study.slug}`, type: "article", jsonLd: {
                    "@context": "https://schema.org",
                    "@type": "Article",
                    headline: study.title,
                    datePublished: study.publishedAt,
                    author: { "@type": "Organization", name: siteMeta.brand },
                    publisher: { "@type": "Organization", name: siteMeta.brand },
                } }), _jsx(PageHero, { eyebrow: study.industry, title: study.title, lead: study.outcome, meta: `Client: ${study.client} · Published ${new Date(study.publishedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}`, actions: _jsx("div", { className: "flex flex-wrap items-center gap-2", children: study.stack.map((s) => (_jsx(Badge, { tone: "neutral", children: s }, s))) }) }), _jsx(Section, { bordered: true, children: _jsx("div", { className: "aspect-video w-full rounded-xl border border-line bg-paper-2" }) }), _jsx(Section, { children: _jsxs("div", { className: "grid gap-6 md:grid-cols-12 md:gap-8", children: [_jsx("div", { className: "md:col-span-8", children: _jsxs(Prose, { children: [_jsx("h2", { children: "The problem" }), _jsx("p", { children: study.problem }), _jsx("h2", { children: "Our approach" }), _jsx("p", { children: study.approach }), _jsx("h2", { children: "Results" }), _jsx("ul", { children: study.results.map((r) => (_jsx("li", { children: r }, r))) })] }) }), _jsx("aside", { className: "md:col-span-4", children: _jsxs("div", { className: "sticky top-24 space-y-5", children: [_jsxs("div", { className: "rounded-lg border border-line bg-paper-2 p-5", children: [_jsx("p", { className: "text-eyebrow uppercase text-ink-300", children: "Industry" }), _jsx("p", { className: "mt-1 text-body font-semibold text-ink-900", children: study.industry })] }), _jsxs("div", { className: "rounded-lg border border-line bg-paper-2 p-5", children: [_jsx("p", { className: "text-eyebrow uppercase text-ink-300", children: "Stack" }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: study.stack.map((s) => (_jsx(Badge, { tone: "neutral", children: s }, s))) })] }), _jsx(Button, { asChild: true, size: "lg", className: "w-full", children: _jsx(Link, { to: "/contact", children: "Talk about a similar build" }) })] }) })] }) }), study.quote && (_jsx(Section, { bordered: true, tone: "muted", children: _jsx("div", { className: "mx-auto max-w-3xl", children: _jsx(Quote, { quote: study.quote.text, author: study.quote.author, role: study.quote.role }) }) })), related.length > 0 && (_jsxs(Section, { bordered: true, children: [_jsx(SectionHeader, { eyebrow: "More from this sector", title: `Other ${study.industry.toLowerCase()} work.` }), _jsx("div", { className: "mt-6 grid gap-6 md:grid-cols-3", children: related.map((r) => (_jsxs(Link, { to: `/work/${r.slug}`, className: "group rounded-lg border border-line bg-paper p-5 transition-colors duration-2 hover:border-accent-500", children: [_jsx("p", { className: "text-eyebrow uppercase text-ink-300", children: r.industry }), _jsx("p", { className: "mt-2 text-title font-semibold text-ink-900 group-hover:text-accent-600", children: r.title }), _jsx("p", { className: "mt-2 text-body text-ink-500", children: r.outcome })] }, r.slug))) })] }))] }));
}
