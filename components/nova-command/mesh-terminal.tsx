"use client";

import type { ReactNode, RefObject } from "react";

export function MeshTerminal({
  title,
  liveLabel = "live",
  children,
  className = "",
  bodyRef,
}: {
  title: string;
  liveLabel?: string;
  children: ReactNode;
  className?: string;
  bodyRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className={`nova-terminal flex min-h-0 flex-col overflow-hidden rounded-2xl border border-amber-400/20 bg-slate-950/80 ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-amber-400/15 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-amber-300/80 lg:px-4">
        <span>{title}</span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
          {liveLabel}
        </span>
      </div>
      <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3 font-mono text-[11px] leading-5 break-words text-amber-100/90 lg:px-4">{children}</div>
    </div>
  );
}
