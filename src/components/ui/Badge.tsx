import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "blue" | "green" | "orange" | "red";
};

const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  blue: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  green: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  orange: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  red: "bg-red-100 text-red-700 ring-1 ring-red-200"
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
