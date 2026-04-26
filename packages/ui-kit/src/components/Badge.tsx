import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const badge = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-sm font-semibold",
  {
    variants: {
      tone: {
        neutral: "bg-paper-3 text-ink-700",
        accent: "bg-accent-50 text-accent-600",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        danger: "bg-danger/10 text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export const Badge = ({ className, tone, ...props }: BadgeProps) => (
  <span className={cn(badge({ tone }), className)} {...props} />
);
