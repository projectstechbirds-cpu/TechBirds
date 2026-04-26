import { cn } from "../utils/cn";

export interface StatProps {
  value: string;
  label: string;
  caption?: string;
  className?: string;
}

export const Stat = ({ value, label, caption, className }: StatProps) => (
  <div className={cn("rounded-lg border border-line bg-paper p-5", className)}>
    <p className="text-display-md text-ink-900">{value}</p>
    <p className="mt-2 text-eyebrow uppercase text-ink-300">{label}</p>
    {caption && <p className="mt-2 text-body-sm text-ink-500">{caption}</p>}
  </div>
);

export const StatGrid = ({ stats }: { stats: StatProps[] }) => (
  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
    {stats.map((s) => (
      <Stat key={s.label} {...s} />
    ))}
  </div>
);
