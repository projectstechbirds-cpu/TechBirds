import * as React from "react";
import { cn } from "../utils/cn";

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField = ({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    <label htmlFor={htmlFor} className="text-body-sm font-semibold text-ink-700">
      {label}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </label>
    {children}
    {error ? (
      <p className="text-body-sm text-danger">{error}</p>
    ) : hint ? (
      <p className="text-body-sm text-ink-500">{hint}</p>
    ) : null}
  </div>
);
