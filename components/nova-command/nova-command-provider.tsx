"use client";

import { NovaAgentDock } from "@/components/nova-command/nova-agent-dock";
import { NovaCommandContext } from "@/components/nova-command/nova-command-context";
import { NovaCommandOverlay } from "@/components/nova-command/nova-command-overlay";
import { isNovaAudioMuted, setNovaAudioMuted, unlockNovaAudio } from "@/lib/nova-audio";
import { useAuth } from "@/providers/auth-provider";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function NovaCommandProvider({ children }: { children: React.ReactNode }) {
  const { can, user } = useAuth();
  const pathname = usePathname();
  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/forgot") || pathname.startsWith("/reset");
  const canEngage = Boolean(user) && !isPublic && can("projects.delete") && can("reports.view");
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isNovaAudioMuted());
  }, []);

  useEffect(() => {
    if (!canEngage) setOpen(false);
  }, [canEngage]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      setNovaAudioMuted(next);
      if (!next) void unlockNovaAudio();
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ open, setOpen, muted, toggleMuted, canEngage }),
    [open, muted, toggleMuted, canEngage],
  );

  return (
    <NovaCommandContext.Provider value={value}>
      {children}
      {canEngage ? <NovaAgentDock /> : null}
      {canEngage && open ? <NovaCommandOverlay /> : null}
    </NovaCommandContext.Provider>
  );
}
