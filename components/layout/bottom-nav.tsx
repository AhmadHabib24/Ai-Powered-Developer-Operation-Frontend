"use client";

import { useLayoutNav } from "@/components/layout/layout-nav-context";
import { bottomNavItems, isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const { can } = useAuth();
  const { menuOpen, toggleMenu } = useLayoutNav();
  const items = bottomNavItems(can);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      <div
        className="grid px-1 pt-1"
        style={{
          gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))`,
          paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))",
        }}
      >
        {items.map((item) => {
          const active = !menuOpen && isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 touch-manipulation flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-muted",
                active && "text-amber-700 dark:text-amber-300",
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-amber-700 dark:text-amber-300")} />
              <span className="w-full truncate text-center">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={toggleMenu}
          className={cn(
            "flex min-w-0 touch-manipulation flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-muted",
            menuOpen && "text-amber-700 dark:text-amber-300",
          )}
        >
          <Menu className={cn("h-5 w-5", menuOpen && "text-amber-700 dark:text-amber-300")} />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
