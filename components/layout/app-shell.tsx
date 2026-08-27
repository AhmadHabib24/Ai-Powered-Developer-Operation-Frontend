"use client";

import { AssignmentInboxModal } from "@/components/tasks/assignment-inbox-modal";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { LayoutNavProvider } from "@/components/layout/layout-nav-context";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { NovaCommandProvider } from "@/components/nova-command/nova-command-provider";
import { useAuth } from "@/providers/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/forgot") || pathname.startsWith("/reset");

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isPublic) {
      router.replace("/login");
    }
  }, [isLoading, user, isPublic, router]);

  return (
    <NovaCommandProvider>
      {isPublic || (!isLoading && !user) ? (
        children
      ) : isLoading ? (
        <div className="grid min-h-dvh place-items-center text-muted">Loading workspace…</div>
      ) : (
        <LayoutNavProvider>
          <div className="flex min-h-dvh">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] lg:p-6">{children}</main>
            </div>
            <MobileDrawer />
            <BottomNav />
            <CommandPalette />
            <AssignmentInboxModal />
          </div>
        </LayoutNavProvider>
      )}
    </NovaCommandProvider>
  );
}
