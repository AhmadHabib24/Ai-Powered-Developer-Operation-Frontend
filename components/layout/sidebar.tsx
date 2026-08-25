"use client";

import { AppNav } from "@/components/layout/app-nav";
import { useAuth } from "@/providers/auth-provider";
import { useBranding } from "@/hooks/use-branding";

export function Sidebar() {
  const { user } = useAuth();
  const branding = useBranding();
  const appName = branding.data?.app_name ?? process.env.NEXT_PUBLIC_APP_NAME ?? "NOVA";

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-slate-950/80 p-5 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        {branding.data?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.data.logo_url} alt="" className="h-10 w-10 rounded-lg bg-white/5 object-contain" />
        ) : null}
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Operations</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{appName}</h1>
        </div>
      </div>
      <AppNav />
      <div className="rounded-xl border border-white/10 p-3 text-xs text-slate-400">
        <p className="font-medium text-white">{user?.name}</p>
        <p>{user?.roles?.[0]?.replace("_", " ")}</p>
      </div>
    </aside>
  );
}
