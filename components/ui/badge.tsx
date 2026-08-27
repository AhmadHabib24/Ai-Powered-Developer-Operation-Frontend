import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  green: "bg-emerald-400/15 text-emerald-300",
  yellow: "bg-amber-400/15 text-amber-300",
  red: "bg-rose-400/15 text-rose-300",
  slate: "bg-white/10 text-slate-300",
  cyan: "bg-amber-400/15 text-amber-300",
  gold: "bg-amber-400/15 text-amber-300",
};

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones | string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", tones[tone] ?? tones.slate, className)}>
      {children}
    </span>
  );
}
