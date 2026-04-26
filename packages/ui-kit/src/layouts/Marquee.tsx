import * as React from "react";
import { cn } from "../utils/cn";

export interface MarqueeProps {
  items: React.ReactNode[];
  /** Pause animation on hover (default true). */
  pauseOnHover?: boolean;
  /** Seconds for one full loop. */
  duration?: number;
  className?: string;
}

/**
 * Pure-CSS infinite marquee. Doubles items so the loop is seamless.
 * Respects prefers-reduced-motion via tokens.css base rules.
 */
export const Marquee = ({
  items,
  pauseOnHover = true,
  duration = 40,
  className,
}: MarqueeProps) => {
  const doubled = [...items, ...items];
  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-max animate-[marquee_var(--marquee-duration)_linear_infinite] gap-8",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex shrink-0 items-center">
            {item}
          </div>
        ))}
      </div>
      <style>
        {`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}
      </style>
    </div>
  );
};
