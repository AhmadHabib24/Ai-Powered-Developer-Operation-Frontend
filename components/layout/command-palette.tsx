"use client";

import { useAuth } from "@/providers/auth-provider";
import { useBranding } from "@/hooks/use-branding";
import { brandAssistantName } from "@/lib/brand";
import { visibleNavLinks } from "@/lib/nav";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { can } = useAuth();
  const branding = useBranding();
  const assistant = brandAssistantName(branding.data?.assistant_name);

  const commands = [
    ...visibleNavLinks(can).map((link) => ({
      label: link.href === "/nova" ? `Talk to ${assistant}` : link.label,
      href: link.href,
    })),
    ...(can("projects.create") ? [{ label: "New project", href: "/projects/new" }] : []),
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
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-background" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Jump to a page or ask ${assistant}…`}
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none"
        />
        <div className="p-2">
          {visible.map((item) => (
            <button
              key={item.href}
              className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-foreground/5"
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
