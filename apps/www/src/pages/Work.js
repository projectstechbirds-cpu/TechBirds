import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { PageHero, Section, LinkCard } from "@techbirds/ui-kit";
import { caseStudies, siteMeta } from "@techbirds/content";
import { Seo } from "@/components/Seo";
export default function Work() {
    return (_jsxs(_Fragment, { children: [_jsx(Seo, { title: "Work \u2014 TechBirds", description: "Selected case studies from healthcare, commerce, and operations.", canonical: `${siteMeta.baseUrl}/work` }), _jsx(PageHero, { eyebrow: "Selected work", title: "Things we shipped.", lead: "Case studies from healthcare, commerce, and operations. Each one is a system that runs in production, not a slide deck." }), _jsxs(Section, { children: [_jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: caseStudies.map((c) => (_jsx(LinkCard, { asChild: true, eyebrow: c.industry, title: c.title, body: c.outcome, meta: c.client, media: _jsx("div", { className: "aspect-video w-full bg-paper-2" }), children: _jsx(Link, { to: `/work/${c.slug}` }) }, c.slug))) }), _jsxs("p", { className: "mt-6 text-body text-ink-500", children: ["Want a deeper look?", " ", _jsx(Link, { to: "/contact", className: "text-accent-600 underline hover:text-accent-500", children: "Tell us about your project." })] })] })] }));
}
