import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@techbirds/ui-kit";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import Work from "./pages/Work";
import CaseStudy from "./pages/CaseStudy";
import Services from "./pages/Services";
import Process from "./pages/Process";
import Ventures from "./pages/Ventures";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
export default function App() {
    return (_jsxs("div", { className: "flex min-h-screen flex-col bg-paper text-ink-900", children: [_jsx(ScrollToTop, {}), _jsx(Nav, {}), _jsx("main", { className: "flex-1", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/work", element: _jsx(Work, {}) }), _jsx(Route, { path: "/work/:slug", element: _jsx(CaseStudy, {}) }), _jsx(Route, { path: "/services", element: _jsx(Services, {}) }), _jsx(Route, { path: "/process", element: _jsx(Process, {}) }), _jsx(Route, { path: "/ventures", element: _jsx(Ventures, {}) }), _jsx(Route, { path: "/about", element: _jsx(About, {}) }), _jsx(Route, { path: "/careers", element: _jsx(Careers, {}) }), _jsx(Route, { path: "/contact", element: _jsx(Contact, {}) }), _jsx(Route, { path: "*", element: _jsx(NotFound, {}) })] }) }), _jsx(Footer, {})] }));
}
