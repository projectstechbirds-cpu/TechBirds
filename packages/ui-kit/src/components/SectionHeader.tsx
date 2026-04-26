import * as React from "react";
import { cn } from "../utils/cn";
import { Eyebrow } from "./Eyebrow";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  ...props
}: SectionHeaderProps) => (
  <div
    className={cn(
      "flex max-w-3xl flex-col gap-3",
      align === "center" && "mx-auto items-center text-center",
      className,
    )}
    {...props}
  >
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2 className="text-display-md text-ink-900">{title}</h2>
    {description && <p className="text-body-lg text-ink-500">{description}</p>}
  </div>
);
