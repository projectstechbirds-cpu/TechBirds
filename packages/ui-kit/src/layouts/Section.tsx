import * as React from "react";
import { cn } from "../utils/cn";
import { Container } from "../components/Container";

export type SectionTone = "default" | "muted" | "inverted";
export type SectionPadding = "sm" | "md" | "lg";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: SectionTone;
  padding?: SectionPadding;
  bordered?: boolean;
  /** Set to false to opt out of the inner Container — pages in full-bleed scenarios. */
  contained?: boolean;
}

const toneClasses: Record<SectionTone, string> = {
  default: "bg-paper text-ink-900",
  muted: "bg-paper-2 text-ink-900",
  inverted: "bg-ink-900 text-paper",
};

const paddingClasses: Record<SectionPadding, string> = {
  sm: "py-5 md:py-6",
  md: "py-6 md:py-8",
  lg: "py-7 md:py-9",
};

/**
 * Single way to draw a page section. Every marketing/portal section uses this —
 * change the rule once, every page updates.
 */
export const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      tone = "default",
      padding = "md",
      bordered = false,
      contained = true,
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <section
      ref={ref}
      className={cn(
        toneClasses[tone],
        paddingClasses[padding],
        bordered && "border-b border-line",
        className,
      )}
      {...props}
    >
      {contained ? <Container>{children}</Container> : children}
    </section>
  ),
);
Section.displayName = "Section";
