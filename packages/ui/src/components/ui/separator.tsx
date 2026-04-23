import type * as React from "react";
import { cn } from "../../lib/utils.js";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: separator is a structural divider, not an interactive widget per WAI-ARIA
    <div
      role="separator"
      className={cn(
        "bg-slate-200",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
