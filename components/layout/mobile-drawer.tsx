"use client";

import { BrandMark, BrandWordmark } from "@/components/brand/brand-mark";
import { AppNav } from "@/components/layout/app-nav";
import { useLayoutNav } from "@/components/layout/layout-nav-context";
import { Button } from "@/components/ui/button";
import { useNovaCommand } from "@/components/nova-command/nova-command-context";
import { useAuth } from "@/providers/auth-provider";
import { useBranding } from "@/hooks/use-branding";
import { brandAppName, brandAssistantName } from "@/lib/brand";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export function MobileDrawer() {
  const { menuOpen, setMenuOpen } = useLayoutNav();
  const { user, signOut } = useAuth();
  const branding = useBranding();
  const { canEngage, setOpen } = useNovaCommand();
  const router = useRouter();
  const appName = brandAppName(branding.data?.app_name);
  const assistant = brandAssistantName(branding.data?.assistant_name);

  if (!menuOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
      <aside className="absolute bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-0 top-0 flex w-[min(20rem,86vw)] flex-col border-r border-white/10 bg-slate-950 p-5 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {branding.data?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.data.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-xl object-contain" />
            ) : (
              <BrandMark variant="dark" className="h-10 w-10 shrink-0 rounded-xl" />
            )}
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.28em] text-amber-400">Operations</p>
              <h1 className="mt-1 truncate text-lg">
                <BrandWordmark />
              </h1>
              <p className="sr-only">{appName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <AppNav onNavigate={() => setMenuOpen(false)} />
        <div className="mt-4 space-y-3">
          {canEngage && (
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                setMenuOpen(false);
                setOpen(true);
              }}
            >
              Engage {assistant}
            </Button>
          )}
          <div className="rounded-xl border border-white/10 p-3 text-xs text-slate-400">
            <p className="font-medium text-white">{user?.name}</p>
            <p>{user?.roles?.[0]?.replace("_", " ")}</p>
          </div>
          <Button
            className="w-full"
            variant="outline"
            onClick={async () => {
              setMenuOpen(false);
              await signOut();
              router.replace("/login");
            }}
          >
            Sign out
          </Button>
        </div>
      </aside>
    </div>
  );
}
