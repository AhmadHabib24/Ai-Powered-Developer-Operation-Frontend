"use client";

import { useNovaCommand } from "@/components/nova-command/nova-command-context";
import { useBranding } from "@/hooks/use-branding";

export function NovaAgentDock() {
  const { open, setOpen, canEngage } = useNovaCommand();
  const branding = useBranding();
  const assistant = branding.data?.assistant_name ?? "NOVA";

  if (!canEngage || open) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="nova-agent-dock group fixed right-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 rounded-2xl border border-cyan-400/20 bg-slate-950/80 px-3 py-2 text-left shadow-[0_0_40px_rgba(34,211,238,0.18)] backdrop-blur-md lg:bottom-5 lg:right-5 lg:z-40 lg:px-4 lg:py-3"
      aria-label={`Engage ${assistant}`}
    >
      <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-cyan-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
        Engage
      </span>
      <span className="mt-1 block text-sm font-medium text-white">{assistant} mesh</span>
      <span className="hidden text-[11px] text-slate-400 group-hover:text-cyan-200 lg:block">Open live command theater</span>
    </button>
  );
}
