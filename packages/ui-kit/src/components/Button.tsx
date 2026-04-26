import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const button = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-sans font-semibold whitespace-nowrap select-none",
    "transition-colors duration-2 ease-out-quart",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    "disabled:opacity-50 disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-accent-500 text-white hover:bg-accent-600",
        ghost: "bg-transparent text-ink-900 hover:bg-paper-3",
        outline: "border border-line text-ink-900 hover:bg-paper-2",
        danger: "bg-danger text-white hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3 text-body-sm rounded-md",
        md: "h-11 px-5 text-body rounded-md",
        lg: "h-12 px-6 text-body-lg rounded-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(button({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";
