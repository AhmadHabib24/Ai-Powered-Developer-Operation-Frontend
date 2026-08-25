"use client";

import { useAuth } from "@/providers/auth-provider";
import { useBranding } from "@/hooks/use-branding";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { can } = useAuth();
  const branding = useBranding();
  const assistant = branding.data?.assistant_name ?? "NOVA";

  const commands = [
    { label: "Go to command center", href: "/dashboard" },
    { label: "My work", href: "/me" },
    { label: "Time log", href: "/time" },
    { label: "Projects", href: "/projects" },
    { label: "New project", href: "/projects/new" },
    { label: "Teams", href: "/teams" },
    { label: "Performance", href: "/performance" },
    { label: `Talk to ${assistant}`, href: "/nova" },
    ...(can("settings.manage") ? [{ label: "Settings", href: "/settings" }] : []),
  ];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onCustom = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("nova:command", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("nova:command", onCustom);
    };
  }, []);

  if (!open) return null;

  const visible = commands.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] sm:p-8 sm:pt-24" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Jump to a page or ask ${assistant}…`}
          className="h-12 w-full border-b border-white/10 bg-transparent px-4 text-sm outline-none"
        />
        <div className="p-2">
          {visible.map((item) => (
            <button
              key={item.href}
              className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
              onClick={() => {
                setOpen(false);
                router.push(item.href);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
