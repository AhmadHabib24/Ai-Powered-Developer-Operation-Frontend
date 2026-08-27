"use client";

import { AppNav } from "@/components/layout/app-nav";
import { BrandMark, BrandWordmark } from "@/components/brand/brand-mark";
import { useAuth } from "@/providers/auth-provider";
import { useBranding } from "@/hooks/use-branding";
import { brandAppName } from "@/lib/brand";

export function Sidebar() {
  const { user } = useAuth();
  const branding = useBranding();
  const appName = brandAppName(branding.data?.app_name);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/70 p-5 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        {branding.data?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.data.logo_url} alt="" className="h-11 w-11 rounded-xl object-contain" />
        ) : (
          <BrandMark className="h-11 w-11 rounded-xl" />
        )}
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.28em] text-amber-700 dark:text-amber-300">Operations</p>
          <h1 className="mt-1 truncate text-lg">
            <BrandWordmark />
          </h1>
          <p className="sr-only">{appName}</p>
        </div>
      </div>
      <AppNav />
      <div className="rounded-xl border border-border bg-foreground/5 p-3 text-xs text-muted">
        <p className="font-medium text-foreground">{user?.name}</p>
        <p>{user?.roles?.[0]?.replace("_", " ")}</p>
      </div>
    </aside>
  );
}
