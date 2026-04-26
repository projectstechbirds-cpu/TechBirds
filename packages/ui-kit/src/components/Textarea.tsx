import * as React from "react";
import { cn } from "../utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 5, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex w-full rounded-md border bg-paper px-3 py-2 text-body text-ink-900",
        "placeholder:text-ink-300 resize-y",
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
Textarea.displayName = "Textarea";
