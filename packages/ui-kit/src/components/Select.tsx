import * as React from "react";
import { cn } from "../utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-11 w-full rounded-md border bg-paper px-3 text-body text-ink-900",
        "transition-colors duration-2 ease-out-quart",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:border-accent-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        invalid ? "border-danger" : "border-line",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
