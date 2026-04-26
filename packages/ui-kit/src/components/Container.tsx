import * as React from "react";
import { cn } from "../utils/cn";

/** Page-level container — clamps to 1280px and pads 40px each side at desktop. */
export const Container = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mx-auto w-full max-w-[1280px] px-5 md:px-8 lg:px-10", className)} {...props} />
);
