import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx("footer", { className: "border-t border-line bg-paper-2", children: _jsxs(Container, { children: [_jsxs("div", { className: "grid gap-6 py-7 md:grid-cols-12 md:gap-8 md:py-8", children: [_jsxs("div", { className: "md:col-span-5", children: [_jsxs("div", { className: "text-title font-semibold", children: [siteMeta.brand.split(" ")[0], _jsx("span", { className: "text-accent-500", children: "." })] }), _jsx("p", { className: "mt-3 max-w-sm text-body text-ink-500", children: siteMeta.description }), _jsxs("p", { className: "mt-3 text-body-sm text-ink-300", children: [siteContact.studio.city, ", ", siteContact.studio.country] })] }), allGroups.map((g) => (_jsxs("div", { className: "md:col-span-2", children: [_jsx("p", { className: "text-eyebrow uppercase text-ink-300", children: g.heading }), _jsx("ul", { className: "mt-3 space-y-2", children: g.links.map((l) => (_jsx("li", { children: l.to.startsWith("http") || l.to.startsWith("mailto") ? (_jsx("a", { href: l.to, className: "text-body-sm text-ink-700 hover:text-accent-500", target: l.to.startsWith("http") ? "_blank" : undefined, rel: "noreferrer", children: l.label })) : (_jsx(Link, { to: l.to, className: "text-body-sm text-ink-700 hover:text-accent-500", children: l.label })) }, l.to))) })] }, g.heading)))] }), _jsxs("div", { className: "flex flex-col items-start justify-between gap-3 border-t border-line py-5 md:flex-row md:items-center", children: [_jsxs("p", { className: "text-body-sm text-ink-500", children: ["\u00A9 ", new Date().getFullYear(), " ", siteMeta.brand, ". All rights reserved."] }), _jsx("p", { className: "text-body-sm text-ink-500", children: siteMeta.tagline })] })] }) }));
}
