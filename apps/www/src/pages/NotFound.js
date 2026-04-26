import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button, PageHero } from "@techbirds/ui-kit";
import { Seo } from "@/components/Seo";
export default function NotFound() {
    return (_jsxs(_Fragment, { children: [_jsx(Seo, { title: "Not found \u2014 TechBirds", noindex: true }), _jsx(PageHero, { eyebrow: "404", title: "Page not found.", lead: "The page you were looking for doesn't exist or has moved.", actions: _jsx(Button, { asChild: true, size: "lg", children: _jsx(Link, { to: "/", children: "Back home" }) }), bordered: false })] }));
}
