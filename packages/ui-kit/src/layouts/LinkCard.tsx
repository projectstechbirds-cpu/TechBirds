import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../utils/cn";

export interface LinkCardProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "title" | "media"> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  meta?: React.ReactNode;
  /** Optional aspect-ratio media slot. */
  media?: React.ReactNode;
  /**
   * When true, renders as a Slot so the consumer can wrap it with a router
   * Link or any anchor of their choice. Default: renders a plain <a>.
   */
  asChild?: boolean;
}

/**
 * One link-card style for case studies, ventures, journal entries.
 * Visual rules live here — pages just feed it data.
 *
 * Usage with React Router:
 *
 *   <LinkCard asChild eyebrow="..." title="...">
 *     <Link to="/path" />
 *   </LinkCard>
 */
export const LinkCard = React.forwardRef<HTMLAnchorElement, LinkCardProps>(
  ({ eyebrow, title, body, meta, media, asChild = false, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";
    const inner = (
      <>
        {media && <div className="mb-4 overflow-hidden rounded-md">{media}</div>}
        {eyebrow && <p className="text-eyebrow uppercase text-ink-300">{eyebrow}</p>}
        <h3 className="mt-2 text-title font-semibold text-ink-900">{title}</h3>
        {body && <p className="mt-2 text-body text-ink-500">{body}</p>}
        {meta && <p className="mt-3 text-body-sm text-ink-300">{meta}</p>}
      </>
    );
    return (
      <Comp
        ref={ref}
        className={cn(
          "group flex h-full flex-col rounded-lg border border-line bg-paper p-5 transition-colors duration-2",
          "hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          className,
        )}
        {...props}
      >
        {asChild ? React.cloneElement(children as React.ReactElement, {}, inner) : inner}
      </Comp>
    );
  },
);
LinkCard.displayName = "LinkCard";
