import type * as React from "react";
import { cn } from "../../lib/utils.js";

export type BadgeVariant = "default" | "secondary" | "outline";

const badgeClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-900 text-white",
  secondary: "bg-slate-100 text-slate-900",
  outline: "border border-slate-300",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        badgeClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
