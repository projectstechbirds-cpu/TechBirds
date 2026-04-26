import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, PageHero, Section, SectionHeader, FormField, Input, Textarea, Select, Spinner, } from "@techbirds/ui-kit";
import { BUDGET_RANGES, ENQUIRY_TYPES, PROJECT_TYPES, } from "@techbirds/sdk";
import { faqs, siteContact, siteMeta } from "@techbirds/content";
import { Seo } from "@/components/Seo";
import { Turnstile } from "@/components/Turnstile";
import { api } from "@/lib/api";
import { ApiError } from "@techbirds/sdk";
const enquirySchema = z.object({
    name: z.string().min(2, "Tell us your name."),
    email: z.string().email("That doesn't look like an email."),
    phone: z.string().optional(),
    company: z.string().optional(),
    enquiry_type: z.enum(["general", "project", "careers", "press", "other"]),
    project_type: z.enum(["web", "mobile", "erp", "ecom", "cloud", "ai"]).optional(),
    budget_range: z.enum(["<5L", "5-15L", "15-50L", "50L+"]).optional(),
    message: z.string().min(20, "A few sentences help us reply usefully."),
    /** Honeypot — must remain empty. */
    website: z.string().max(0, "").optional(),
});
export default function Contact() {
    const [status, setStatus] = useState("idle");
    const [errorMsg, setErrorMsg] = useState(null);
    const [token, setToken] = useState(null);
    const form = useForm({
        resolver: zodResolver(enquirySchema),
        defaultValues: { enquiry_type: "project" },
    });
    const onSubmit = form.handleSubmit(async (values) => {
        if (!token) {
            setErrorMsg("Please complete the captcha first.");
            setStatus("error");
            return;
        }
        setStatus("submitting");
        setErrorMsg(null);
        const payload = {
            ...values,
            turnstile_token: token,
        };
        try {
            await api.createEnquiry(payload);
            setStatus("ok");
            form.reset({ enquiry_type: "project" });
        }
        catch (err) {
            setStatus("error");
            if (err instanceof ApiError) {
                setErrorMsg(`We couldn't send that (${err.status}). Try again or email us directly.`);
            }
            else {
                setErrorMsg("Network error. Try again or email us directly.");
            }
        }
    });
    const watchType = form.watch("enquiry_type");
    const isProject = watchType === "project";
    return (_jsxs(_Fragment, { children: [_jsx(Seo, { title: "Contact \u2014 TechBirds", description: "Tell us about your project. We reply within one business day.", canonical: `${siteMeta.baseUrl}/contact` }), _jsx(PageHero, { eyebrow: "Talk to us", title: "Tell us about your project.", lead: "A real engineer reads every enquiry. We reply within one business day, usually faster." }), _jsx(Section, { bordered: true, children: _jsxs("div", { className: "grid gap-6 md:grid-cols-12 md:gap-8", children: [_jsx("div", { className: "md:col-span-8", children: status === "ok" ? (_jsxs("div", { className: "rounded-xl border border-success bg-success/5 p-7", children: [_jsx("p", { className: "text-eyebrow uppercase text-success", children: "Message sent" }), _jsx("h2", { className: "mt-2 text-headline font-semibold text-ink-900", children: "Thanks \u2014 we'll be in touch." }), _jsxs("p", { className: "mt-3 text-body text-ink-700", children: ["Expect a reply within one business day from", " ", _jsx("a", { className: "text-accent-600 underline hover:text-accent-500", href: `mailto:${siteContact.emails.info}`, children: siteContact.emails.info }), "."] }), _jsx(Button, { className: "mt-5", variant: "outline", onClick: () => setStatus("idle"), children: "Send another" })] })) : (_jsxs("form", { noValidate: true, onSubmit: onSubmit, className: "grid gap-5", children: [_jsx("input", { type: "text", tabIndex: -1, autoComplete: "off", "aria-hidden": "true", className: "absolute left-[-9999px]", ...form.register("website") }), _jsxs("div", { className: "grid gap-5 md:grid-cols-2", children: [_jsx(FormField, { label: "Your name", htmlFor: "name", required: true, error: form.formState.errors.name?.message, children: _jsx(Input, { id: "name", autoComplete: "name", ...form.register("name") }) }), _jsx(FormField, { label: "Work email", htmlFor: "email", required: true, error: form.formState.errors.email?.message, children: _jsx(Input, { id: "email", type: "email", autoComplete: "email", ...form.register("email") }) })] }), _jsxs("div", { className: "grid gap-5 md:grid-cols-2", children: [_jsx(FormField, { label: "Company", htmlFor: "company", children: _jsx(Input, { id: "company", autoComplete: "organization", ...form.register("company") }) }), _jsx(FormField, { label: "Phone (optional)", htmlFor: "phone", children: _jsx(Input, { id: "phone", type: "tel", autoComplete: "tel", ...form.register("phone") }) })] }), _jsx(FormField, { label: "What's this about?", htmlFor: "enquiry_type", required: true, children: _jsx(Select, { id: "enquiry_type", ...form.register("enquiry_type"), children: ENQUIRY_TYPES.map((t) => (_jsx("option", { value: t.value, children: t.label }, t.value))) }) }), isProject && (_jsxs("div", { className: "grid gap-5 md:grid-cols-2", children: [_jsx(FormField, { label: "Project type", htmlFor: "project_type", children: _jsxs(Select, { id: "project_type", ...form.register("project_type"), children: [_jsx("option", { value: "", children: "\u2014 Choose \u2014" }), PROJECT_TYPES.map((t) => (_jsx("option", { value: t.value, children: t.label }, t.value)))] }) }), _jsx(FormField, { label: "Budget", htmlFor: "budget_range", children: _jsxs(Select, { id: "budget_range", ...form.register("budget_range"), children: [_jsx("option", { value: "", children: "\u2014 Choose \u2014" }), BUDGET_RANGES.map((b) => (_jsx("option", { value: b.value, children: b.label }, b.value)))] }) })] })), _jsx(FormField, { label: "Tell us more", htmlFor: "message", required: true, hint: "What are you trying to build, and what's the deadline that matters?", error: form.formState.errors.message?.message, children: _jsx(Textarea, { id: "message", rows: 6, ...form.register("message") }) }), _jsx(Turnstile, { onToken: setToken }), status === "error" && errorMsg && (_jsx("p", { className: "text-body-sm text-danger", children: errorMsg })), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Button, { type: "submit", size: "lg", disabled: status === "submitting", children: [status === "submitting" ? _jsx(Spinner, {}) : null, status === "submitting" ? "Sending…" : "Send message"] }), _jsxs("p", { className: "text-body-sm text-ink-500", children: ["or email", " ", _jsx("a", { className: "text-accent-600 underline hover:text-accent-500", href: `mailto:${siteContact.emails.info}`, children: siteContact.emails.info })] })] })] })) }), _jsx("aside", { className: "md:col-span-4", children: _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "rounded-lg border border-line bg-paper-2 p-5", children: [_jsx("p", { className: "text-eyebrow uppercase text-ink-300", children: "Email" }), _jsxs("ul", { className: "mt-3 space-y-2", children: [_jsxs("li", { children: [_jsx("a", { className: "text-body text-ink-700 hover:text-accent-500", href: `mailto:${siteContact.emails.info}`, children: siteContact.emails.info }), _jsx("span", { className: "block text-body-sm text-ink-300", children: "General enquiries" })] }), _jsxs("li", { children: [_jsx("a", { className: "text-body text-ink-700 hover:text-accent-500", href: `mailto:${siteContact.emails.hr}`, children: siteContact.emails.hr }), _jsx("span", { className: "block text-body-sm text-ink-300", children: "Careers" })] })] })] }), _jsxs("div", { className: "rounded-lg border border-line bg-paper-2 p-5", children: [_jsx("p", { className: "text-eyebrow uppercase text-ink-300", children: "Studio" }), _jsx("p", { className: "mt-3 text-body text-ink-700", children: siteContact.studio.address })] }), _jsxs("div", { className: "rounded-lg border border-line bg-paper-2 p-5", children: [_jsx("p", { className: "text-eyebrow uppercase text-ink-300", children: "Or book a call" }), _jsx(Button, { asChild: true, className: "mt-3 w-full", variant: "outline", children: _jsx("a", { href: siteContact.calendly, target: "_blank", rel: "noreferrer", children: "Schedule on Calendly" }) })] })] }) })] }) }), _jsxs(Section, { bordered: true, tone: "muted", children: [_jsx(SectionHeader, { eyebrow: "Common questions", title: "Before you write." }), _jsx("dl", { className: "mt-6 grid gap-6 md:grid-cols-2", children: faqs.slice(0, 4).map((f) => (_jsxs("div", { className: "rounded-lg border border-line bg-paper p-5", children: [_jsx("dt", { className: "text-title font-semibold text-ink-900", children: f.question }), _jsx("dd", { className: "mt-2 text-body text-ink-500", children: f.answer })] }, f.question))) })] })] }));
}
