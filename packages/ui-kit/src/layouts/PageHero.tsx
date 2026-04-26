import * as React from "react";
import { cn } from "../utils/cn";
import { Section } from "./Section";
import { Eyebrow } from "../components/Eyebrow";

export interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Optional CTAs / inline actions rendered under the lead. */
  actions?: React.ReactNode;
  /** Optional right-rail (image, illustration, embedded card). */
  aside?: React.ReactNode;
  /** Page sub-meta below actions (e.g. client name, post date). */
  meta?: React.ReactNode;
  bordered?: boolean;
  className?: string;
}

/**
 * Every page on every app starts with this. One control point for hero spacing,
 * type scale, and grid behavior.
 */
export const PageHero = ({
  eyebrow,
  title,
  lead,
  actions,
  aside,
  meta,
  bordered = true,
  className,
}: PageHeroProps) => (
  <Section bordered={bordered} className={className}>
    <div className={cn("grid gap-6 md:grid-cols-12 md:gap-8")}>
      <div className={cn(aside ? "md:col-span-7 lg:col-span-7" : "md:col-span-12 lg:col-span-9")}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 text-display-lg text-ink-900 md:text-display-xl">{title}</h1>
        {lead && <p className="mt-4 max-w-2xl text-body-lg text-ink-500">{lead}</p>}
        {actions && <div className="mt-5 flex flex-wrap items-center gap-3">{actions}</div>}
        {meta && <p className="mt-4 text-body-sm text-ink-300">{meta}</p>}
      </div>
      {aside && <div className="md:col-span-5 lg:col-span-5">{aside}</div>}
    </div>
  </Section>
);
