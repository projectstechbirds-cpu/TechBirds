import * as React from "react";
import { cn } from "../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-11 w-full rounded-md border bg-paper px-3 text-body text-ink-900",
        "placeholder:text-ink-300",
        "transition-colors duration-2 ease-out-quart",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:border-accent-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        invalid ? "border-danger" : "border-line",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
