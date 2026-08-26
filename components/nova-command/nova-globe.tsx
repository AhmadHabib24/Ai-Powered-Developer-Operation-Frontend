"use client";

import { visibleNavLinks } from "@/lib/nav";
import { playNovaHover, playNovaSelect } from "@/lib/nova-audio";
import { useAuth } from "@/providers/auth-provider";
import { useBranding } from "@/hooks/use-branding";
import { useEffect, useMemo, useRef } from "react";

export function NovaGlobe({
  onNavigate,
}: {
  onNavigate: (href: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useAuth();
  const branding = useBranding();
  const assistant = branding.data?.assistant_name ?? "NOVA";
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const nodes = useMemo(
    () =>
      visibleNavLinks((permission) => Boolean(user?.permissions?.includes(permission))).map((link) => ({
        ...link,
        label: link.href === "/nova" ? `Talk to ${assistant}` : link.label,
      })),
    [assistant, user?.permissions],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let raf = 0;
    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2 + 8;
      const radius = Math.min(width, height) * 0.32;
      const rot = reduced ? 0.4 : frame * 0.004;

      ctx.save();
      ctx.translate(cx, cy + radius * 0.95);
      ctx.scale(1, 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.55, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(34,211,238,0.28)";
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(34,211,238,0.18)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.15);
      glow.addColorStop(0, "rgba(8, 47, 73, 0.15)");
      glow.addColorStop(0.7, "rgba(34, 211, 238, 0.08)");
      glow.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.fillStyle = glow;
      ctx.fill();

      for (let lat = -60; lat <= 60; lat += 18) {
        ctx.beginPath();
        for (let lon = 0; lon <= 360; lon += 6) {
          const [x, y, z] = project(lat, lon + rot * 57.3, radius);
          if (lon === 0) ctx.moveTo(cx + x, cy + y);
          else if (z > -0.15) ctx.lineTo(cx + x, cy + y);
        }
        ctx.strokeStyle = "rgba(34,211,238,0.22)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let lon = 0; lon < 360; lon += 24) {
        ctx.beginPath();
        let started = false;
        for (let lat = -70; lat <= 70; lat += 6) {
          const [x, y, z] = project(lat, lon + rot * 57.3, radius);
          if (z <= -0.1) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(cx + x, cy + y);
            started = true;
          } else ctx.lineTo(cx + x, cy + y);
        }
        ctx.strokeStyle = "rgba(125,211,252,0.18)";
        ctx.stroke();
      }

      for (let i = 0; i < 90; i += 1) {
        const lat = ((i * 47) % 140) - 70;
        const lon = (i * 41 + rot * 80) % 360;
        const [x, y, z] = project(lat, lon, radius);
        if (z < 0.05) continue;
        const lit = i % 5 === 0;
        ctx.fillStyle = lit ? "rgba(34,211,238,0.85)" : "rgba(186,230,253,0.35)";
        hex(ctx, cx + x, cy + y, lit ? 4.5 : 2.6);
      }

      frame += 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    const resize = () => {
      const parent = canvas.parentElement;
      const compact = window.matchMedia("(max-width: 1023px)").matches;
      const cap = compact ? 168 : 420;
      const size = Math.min(parent?.clientWidth ?? cap, cap);
      canvas.width = size;
      canvas.height = size;
    };
    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  return (
    <div className="w-full">
      <div className="relative mx-auto aspect-square w-full max-w-[168px] lg:max-w-[420px]">
        <canvas ref={canvasRef} className="h-full w-full" />
        {nodes.map((node, index) => {
          const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const left = 50 + Math.cos(angle) * 42;
          const top = 50 + Math.sin(angle) * 38;
          const Icon = node.icon;
          return (
            <button
              key={node.href}
              type="button"
              className="nova-orbit-node absolute hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 lg:flex"
              style={{ left: `${left}%`, top: `${top}%` }}
              onMouseEnter={() => playNovaHover()}
              onClick={() => {
                playNovaSelect();
                onNavigate(node.href);
              }}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-cyan-300/40 bg-slate-950/80 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.35)]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="max-w-[5.5rem] truncate rounded-full bg-slate-950/70 px-2 py-[2px] text-[10px] uppercase tracking-wide text-cyan-100">
                {node.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 lg:hidden">
        {nodes.map((node) => {
          const Icon = node.icon;
          return (
            <button
              key={`mobile-${node.href}`}
              type="button"
              onClick={() => {
                playNovaSelect();
                onNavigate(node.href);
              }}
              className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-cyan-400/20 bg-slate-950/70 px-1 py-2 text-cyan-100"
            >
              <Icon className="h-4 w-4 text-cyan-300" />
              <span className="w-full truncate text-[9px] uppercase tracking-wide">{node.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function project(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const theta = (lon * Math.PI) / 180;
  const x = Math.cos(phi) * Math.sin(theta);
  const y = Math.sin(phi);
  const z = Math.cos(phi) * Math.cos(theta);
  return [x * radius, y * radius * 0.92, z];
}

function hex(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const px = x + size * Math.cos(angle);
    const py = y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
