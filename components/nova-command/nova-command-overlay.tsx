"use client";

import { NovaGlobe } from "@/components/nova-command/nova-globe";
import { NovaNewsTerminal } from "@/components/nova-command/nova-news-terminal";
import { NovaTaskTerminal } from "@/components/nova-command/nova-task-terminal";
import { NovaTerminal } from "@/components/nova-command/nova-terminal";
import { Button } from "@/components/ui/button";
import { useNovaCommand } from "@/components/nova-command/nova-command-context";
import { useBranding } from "@/hooks/use-branding";
import { brandAssistantName } from "@/lib/brand";
import { playNovaBoot, silenceNovaVoice, speakNova, startNovaDrone, stopNovaDrone, unlockNovaAudio } from "@/lib/nova-audio";
import { cn } from "@/lib/utils";
import { Volume2, VolumeX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MOBILE_PANELS = [
  { id: "ops", label: "Ops" },
  { id: "tasks", label: "Tasks" },
  { id: "wire", label: "Wire" },
] as const;

type MobilePanel = (typeof MOBILE_PANELS)[number]["id"];

function useDesktopLayout() {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : false,
  );
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function NovaCommandOverlay() {
  const { setOpen, muted, toggleMuted } = useNovaCommand();
  const branding = useBranding();
  const assistant = brandAssistantName(branding.data?.assistant_name);
  const router = useRouter();
  const desktop = useDesktopLayout();
  const [panel, setPanel] = useState<MobilePanel>("ops");

  useEffect(() => {
    let alive = true;
    void (async () => {
      await unlockNovaAudio();
      if (!alive) return;
      playNovaBoot();
      startNovaDrone();
      speakNova(`${assistant} online. Loading global mesh.`);
    })();
    return () => {
      alive = false;
      stopNovaDrone();
      silenceNovaVoice();
    };
  }, [assistant]);

  const close = () => setOpen(false);

  const navigate = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <div className="nova-command-overlay fixed inset-0 z-[80] flex h-dvh flex-col overflow-hidden">
      <div className="relative flex shrink-0 items-center justify-between gap-3 px-3 py-2 lg:px-6 lg:py-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.35em] text-amber-700 dark:text-amber-300/80">Global mesh</p>
          <h2 className="truncate text-sm font-semibold text-foreground sm:text-lg">{assistant} command theater</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="sm" onClick={toggleMuted} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{muted ? "Muted" : "Audio on"}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={close}>
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Close</span>
          </Button>
        </div>
      </div>

      {desktop ? (
        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden px-4 pb-4 lg:grid-cols-[minmax(240px,1fr)_minmax(0,1.35fr)_minmax(260px,1fr)]">
          <NovaTerminal enabled />
          <div className="flex min-h-0 flex-col gap-4">
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
              <p className="mb-2 text-center text-[10px] uppercase tracking-[0.3em] text-amber-400/70">Tap a node to jump</p>
              <NovaGlobe onNavigate={navigate} />
            </div>
            <NovaNewsTerminal enabled />
          </div>
          <NovaTaskTerminal enabled onOpenTask={(id) => navigate(`/tasks/${id}`)} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-h-[46%] shrink-0 overflow-y-auto">
            <p className="mb-2 text-center text-[10px] uppercase tracking-[0.3em] text-amber-400/70">Tap a node to jump</p>
            <NovaGlobe onNavigate={navigate} />
          </div>
          <div className="grid shrink-0 grid-cols-3 rounded-xl border border-amber-400/20 bg-background/80 p-1">
            {MOBILE_PANELS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPanel(item.id)}
                className={cn(
                  "rounded-lg px-2 py-2 text-[10px] uppercase tracking-[0.18em] text-amber-500",
                  panel === item.id && "bg-amber-400/15 text-amber-800 dark:text-amber-100",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            <div className={cn("h-full", panel !== "ops" && "hidden")}>
              <NovaTerminal enabled />
            </div>
            <div className={cn("h-full", panel !== "tasks" && "hidden")}>
              <NovaTaskTerminal enabled onOpenTask={(id) => navigate(`/tasks/${id}`)} />
            </div>
            <div className={cn("h-full", panel !== "wire" && "hidden")}>
              <NovaNewsTerminal enabled className="h-full min-h-0" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
