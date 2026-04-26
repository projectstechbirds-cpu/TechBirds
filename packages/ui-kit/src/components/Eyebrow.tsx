import * as React from "react";
import { cn } from "../utils/cn";

/** Section kicker — uppercase, mono-tracked label above headings. */
export const Eyebrow = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-eyebrow uppercase text-accent-600", className)} {...props} />
);
