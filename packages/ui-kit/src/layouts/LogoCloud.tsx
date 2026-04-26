import { cn } from "../utils/cn";

export interface LogoCloudProps {
  label: string;
  items: string[];
  className?: string;
}

/**
 * Industry / client text strip. Keep it text-only until we have logos licensed.
 */
export const LogoCloud = ({ label, items, className }: LogoCloudProps) => (
  <div className={className}>
    <p className="text-eyebrow uppercase text-ink-300">{label}</p>
    <div className={cn("mt-5 flex flex-wrap gap-x-8 gap-y-3 text-body text-ink-500")}>
      {items.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  </div>
);
