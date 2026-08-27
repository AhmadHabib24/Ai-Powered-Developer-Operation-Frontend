"use client";

import { BrandMark } from "@/components/brand/brand-mark";
import { useNovaCommand } from "@/components/nova-command/nova-command-context";
import { useBranding } from "@/hooks/use-branding";
import { brandAssistantName } from "@/lib/brand";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "nova_engage_dock";
const DRAG_THRESHOLD = 6;

type DockPos = { x: number; y: number };

function readSavedPos(): DockPos | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DockPos;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function clampPos(pos: DockPos, width: number, height: number): DockPos {
  const pad = 8;
  const maxX = Math.max(pad, window.innerWidth - width - pad);
  const maxY = Math.max(pad, window.innerHeight - height - pad);
  return {
    x: Math.min(Math.max(pad, pos.x), maxX),
    y: Math.min(Math.max(pad, pos.y), maxY),
  };
}

export function NovaAgentDock() {
  const { open, setOpen, canEngage } = useNovaCommand();
  const branding = useBranding();
  const assistant = brandAssistantName(branding.data?.assistant_name);
  const dockRef = useRef<HTMLButtonElement>(null);
  const posRef = useRef<DockPos | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);
  const [pos, setPos] = useState<DockPos | null>(null);
  const [dragging, setDragging] = useState(false);

  const persist = useCallback((next: DockPos) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const moveTo = useCallback((next: DockPos) => {
    posRef.current = next;
    setPos(next);
  }, []);

  useEffect(() => {
    if (!canEngage || open) return;
    const node = dockRef.current;
    const saved = readSavedPos();
    if (!saved || !node) return;
    const { width, height } = node.getBoundingClientRect();
    moveTo(clampPos(saved, width, height));
  }, [canEngage, open, moveTo]);

  useEffect(() => {
    const onResize = () => {
      const node = dockRef.current;
      if (!node || !posRef.current) return;
      const { width, height } = node.getBoundingClientRect();
      const next = clampPos(posRef.current, width, height);
      moveTo(next);
      persist(next);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [moveTo, persist]);

  if (!canEngage || open) return null;

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const node = dockRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origX: rect.left,
      origY: rect.top,
      moved: false,
    };
    node.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const node = dockRef.current;
    if (!drag || !node || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    setDragging(true);
    event.preventDefault();
    const { width, height } = node.getBoundingClientRect();
    moveTo(clampPos({ x: drag.origX + dx, y: drag.origY + dy }, width, height));
  };

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const node = dockRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (node?.hasPointerCapture(event.pointerId)) {
      node.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
    if (drag.moved) {
      if (posRef.current) persist(posRef.current);
      return;
    }
    setOpen(true);
  };

  return (
    <button
      ref={dockRef}
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="nova-agent-dock group fixed right-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 touch-none select-none rounded-2xl border border-amber-400/25 bg-background px-3 py-2 text-left shadow-[0_0_40px_rgba(245,158,11,0.22)] backdrop-blur-md lg:bottom-5 lg:right-5 lg:px-4 lg:py-3"
      style={
        pos
          ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto", cursor: dragging ? "grabbing" : "grab" }
          : { cursor: dragging ? "grabbing" : "grab" }
      }
      aria-label={`Engage ${assistant}. Drag to move.`}
    >
      <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-amber-700 dark:text-amber-300">
        <BrandMark variant="nora" className="h-6 w-6 rounded-full" />
        Engage
      </span>
      <span className="mt-1 block text-sm font-medium text-foreground">{assistant} mesh</span>
      <span className="hidden text-[11px] text-muted group-hover:text-amber-700 dark:hover:text-amber-800 dark:text-amber-200 lg:block">Drag anywhere · click to open</span>
    </button>
  );
}
