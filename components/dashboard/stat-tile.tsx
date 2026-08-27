import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "gold",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "gold" | "red" | "green" | "slate";
}) {
  const bar = {
    gold: "from-amber-500 to-orange-500",
    red: "from-rose-500 to-orange-500",
    green: "from-emerald-500 to-teal-500",
    slate: "from-stone-400 to-stone-500",
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[0_12px_40px_rgba(28,25,23,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
      <div className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b", bar)} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
