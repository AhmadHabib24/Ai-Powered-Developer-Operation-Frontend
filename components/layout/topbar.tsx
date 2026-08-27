"use client";

import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useBranding } from "@/hooks/use-branding";
import { brandAppName, brandAssistantName } from "@/lib/brand";
import { mobilePageTitle } from "@/lib/nav";
import { Mic, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const branding = useBranding();
  const assistant = brandAssistantName(branding.data?.assistant_name);
  const appName = brandAppName(branding.data?.app_name);
  const title = mobilePageTitle(pathname, appName, assistant);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-3 py-3 backdrop-blur-md lg:px-6 lg:py-4">
      <h1 className="min-w-0 truncate text-sm font-medium text-foreground lg:hidden">{title}</h1>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("nova:command"))}
        className="hidden h-10 w-80 items-center gap-2 rounded-xl border border-border bg-foreground/5 px-3 text-sm text-muted lg:flex"
      >
        <Search className="h-4 w-4" />
        Search or ask {assistant}
        <kbd className="ml-auto rounded bg-foreground/10 px-1.5 text-[10px]">⌘K</kbd>
      </button>
      <div className="flex items-center gap-1 lg:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={`Search or ask ${assistant}`}
          onClick={() => window.dispatchEvent(new Event("nova:command"))}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button className="hidden lg:inline-flex" variant="secondary" onClick={() => router.push("/nova")}>
          <Mic className="h-4 w-4" />
          Talk to {assistant}
        </Button>
        <ThemeToggle />
        <NotificationBell />
        <Button
          className="hidden lg:inline-flex"
          variant="outline"
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
        >
          Sign out
        </Button>
        <span className="hidden text-sm text-muted lg:inline">{user?.name}</span>
      </div>
    </header>
  );
}
