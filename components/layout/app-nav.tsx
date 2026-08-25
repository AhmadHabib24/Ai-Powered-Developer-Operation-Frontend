"use client";

import { useAuth } from "@/providers/auth-provider";
import { useBranding } from "@/hooks/use-branding";
import { cn } from "@/lib/utils";
import { isNavActive, visibleNavLinks } from "@/lib/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();
  const { can } = useAuth();
  const branding = useBranding();
  const assistant = branding.data?.assistant_name ?? "NOVA";

  return (
    <nav className={cn("flex flex-1 flex-col gap-1 overflow-y-auto", className)}>
      {visibleNavLinks(can).map((link) => {
        const active = isNavActive(pathname, link.href);
        const label = link.href === "/nova" ? `Talk to ${assistant}` : link.label;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white",
              active && "bg-cyan-400/10 text-cyan-200",
            )}
          >
            <link.icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
