import * as React from "react";
import { cn } from "../utils/cn";

/**
 * Long-form content wrapper. One source of truth for typography rhythm in
 * blog posts, case studies, and policy pages.
 */
export const Prose = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "max-w-2xl text-body text-ink-700",
      "[&_h2]:mt-9 [&_h2]:text-headline [&_h2]:font-semibold [&_h2]:text-ink-900",
      "[&_h3]:mt-7 [&_h3]:text-title [&_h3]:font-semibold [&_h3]:text-ink-900",
      "[&_p]:mt-4",
      "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:mt-1.5",
      "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol>li]:mt-1.5",
      "[&_a]:text-accent-600 [&_a]:underline [&_a:hover]:text-accent-500",
      "[&_blockquote]:mt-5 [&_blockquote]:border-l-2 [&_blockquote]:border-accent-500 [&_blockquote]:pl-4 [&_blockquote]:text-body-lg [&_blockquote]:text-ink-700",
      "[&_code]:rounded [&_code]:bg-paper-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-mono",
      "[&_pre]:mt-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-paper-3 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-mono",
      "[&_img]:mt-5 [&_img]:rounded-md [&_img]:border [&_img]:border-line",
      "[&_hr]:my-8 [&_hr]:border-line",
      className,
    )}
    {...props}
  />
);
