import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  PageHero,
  Section,
  SectionHeader,
  FormField,
  Input,
  Textarea,
  Select,
  Spinner,
} from "@techbirds/ui-kit";
import {
  BUDGET_RANGES,
  ENQUIRY_TYPES,
  PROJECT_TYPES,
  type EnquiryCreate,
} from "@techbirds/sdk";
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

type FormValues = z.infer<typeof enquirySchema>;
type Status = "idle" | "submitting" | "ok" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const form = useForm<FormValues>({
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
    const payload: EnquiryCreate = {
      ...values,
      turnstile_token: token,
    };
    try {
      await api.createEnquiry(payload);
      setStatus("ok");
      form.reset({ enquiry_type: "project" });
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiError) {
        setErrorMsg(`We couldn't send that (${err.status}). Try again or email us directly.`);
      } else {
        setErrorMsg("Network error. Try again or email us directly.");
      }
    }
  });

  const watchType = form.watch("enquiry_type");
  const isProject = watchType === "project";

  return (
    <>
      <Seo
        title="Contact — TechBirds"
        description="Tell us about your project. We reply within one business day."
        canonical={`${siteMeta.baseUrl}/contact`}
      />
      <PageHero
        eyebrow="Talk to us"
        title="Tell us about your project."
        lead="A real engineer reads every enquiry. We reply within one business day, usually faster."
      />

      <Section bordered>
        <div className="grid gap-6 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-8">
            {status === "ok" ? (
              <div className="rounded-xl border border-success bg-success/5 p-7">
                <p className="text-eyebrow uppercase text-success">Message sent</p>
                <h2 className="mt-2 text-headline font-semibold text-ink-900">
                  Thanks — we'll be in touch.
                </h2>
                <p className="mt-3 text-body text-ink-700">
                  Expect a reply within one business day from{" "}
                  <a
                    className="text-accent-600 underline hover:text-accent-500"
                    href={`mailto:${siteContact.emails.info}`}
                  >
                    {siteContact.emails.info}
                  </a>
                  .
                </p>
                <Button
                  className="mt-5"
                  variant="outline"
                  onClick={() => setStatus("idle")}
                >
                  Send another
                </Button>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} className="grid gap-5">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-9999px]"
                  {...form.register("website")}
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    label="Your name"
                    htmlFor="name"
                    required
                    error={form.formState.errors.name?.message}
                  >
                    <Input id="name" autoComplete="name" {...form.register("name")} />
                  </FormField>
                  <FormField
                    label="Work email"
                    htmlFor="email"
                    required
                    error={form.formState.errors.email?.message}
                  >
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...form.register("email")}
                    />
                  </FormField>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Company" htmlFor="company">
                    <Input id="company" autoComplete="organization" {...form.register("company")} />
                  </FormField>
                  <FormField label="Phone (optional)" htmlFor="phone">
                    <Input id="phone" type="tel" autoComplete="tel" {...form.register("phone")} />
                  </FormField>
                </div>

                <FormField label="What's this about?" htmlFor="enquiry_type" required>
                  <Select id="enquiry_type" {...form.register("enquiry_type")}>
                    {ENQUIRY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </FormField>

                {isProject && (
                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField label="Project type" htmlFor="project_type">
                      <Select id="project_type" {...form.register("project_type")}>
                        <option value="">— Choose —</option>
                        {PROJECT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Budget" htmlFor="budget_range">
                      <Select id="budget_range" {...form.register("budget_range")}>
                        <option value="">— Choose —</option>
                        {BUDGET_RANGES.map((b) => (
                          <option key={b.value} value={b.value}>
                            {b.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>
                )}

                <FormField
                  label="Tell us more"
                  htmlFor="message"
                  required
                  hint="What are you trying to build, and what's the deadline that matters?"
                  error={form.formState.errors.message?.message}
                >
                  <Textarea id="message" rows={6} {...form.register("message")} />
                </FormField>

                <Turnstile onToken={setToken} />

                {status === "error" && errorMsg && (
                  <p className="text-body-sm text-danger">{errorMsg}</p>
                )}

                <div className="flex items-center gap-3">
                  <Button type="submit" size="lg" disabled={status === "submitting"}>
                    {status === "submitting" ? <Spinner /> : null}
                    {status === "submitting" ? "Sending…" : "Send message"}
                  </Button>
                  <p className="text-body-sm text-ink-500">
                    or email{" "}
                    <a
                      className="text-accent-600 underline hover:text-accent-500"
                      href={`mailto:${siteContact.emails.info}`}
                    >
                      {siteContact.emails.info}
                    </a>
                  </p>
                </div>
              </form>
            )}
          </div>

          <aside className="md:col-span-4">
            <div className="space-y-5">
              <div className="rounded-lg border border-line bg-paper-2 p-5">
                <p className="text-eyebrow uppercase text-ink-300">Email</p>
                <ul className="mt-3 space-y-2">
                  <li>
                    <a
                      className="text-body text-ink-700 hover:text-accent-500"
                      href={`mailto:${siteContact.emails.info}`}
                    >
                      {siteContact.emails.info}
                    </a>
                    <span className="block text-body-sm text-ink-300">General enquiries</span>
                  </li>
                  <li>
                    <a
                      className="text-body text-ink-700 hover:text-accent-500"
                      href={`mailto:${siteContact.emails.hr}`}
                    >
                      {siteContact.emails.hr}
                    </a>
                    <span className="block text-body-sm text-ink-300">Careers</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-line bg-paper-2 p-5">
                <p className="text-eyebrow uppercase text-ink-300">Studio</p>
                <p className="mt-3 max-w-sm text-body leading-relaxed text-ink-700">
                  {siteContact.studio.address}
                </p>
              </div>
              <div className="rounded-lg border border-line bg-paper-2 p-5">
                <p className="text-eyebrow uppercase text-ink-300">Or book a call</p>
                <Button asChild className="mt-3 w-full" variant="outline">
                  <a href={siteContact.calendly} target="_blank" rel="noreferrer">
                    Schedule on Calendly
                  </a>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </Section>

      <Section bordered tone="muted">
        <SectionHeader eyebrow="Common questions" title="Before you write." />
        <dl className="mt-6 grid gap-6 md:grid-cols-2">
          {faqs.slice(0, 4).map((f) => (
            <div key={f.question} className="rounded-lg border border-line bg-paper p-5">
              <dt className="text-title font-semibold text-ink-900">{f.question}</dt>
              <dd className="mt-2 text-body text-ink-500">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
