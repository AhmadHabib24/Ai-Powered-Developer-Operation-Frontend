import type { LucideIcon } from "lucide-react";
import {
  Clock,
  FolderKanban,
  Home,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Timer,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Command", icon: LayoutDashboard, permission: "reports.view" },
  { href: "/me", label: "My work", icon: Timer },
  { href: "/time", label: "Time", icon: Clock, permission: "time.view" },
  { href: "/projects", label: "Projects", icon: FolderKanban, permission: "projects.view" },
  { href: "/teams", label: "Teams", icon: UsersRound, permission: "teams.view" },
  { href: "/people", label: "People", icon: Users, permission: "users.view" },
  { href: "/performance", label: "Performance", icon: Trophy, permission: "performance.view" },
  { href: "/nova", label: "Talk to NOVA", icon: MessageSquareText, permission: "ai.use" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
];

const BOTTOM_SHORTCUTS = ["/projects", "/time", "/nova"] as const;

export function visibleNavLinks(can: (permission: string) => boolean): NavLink[] {
  return NAV_LINKS.filter((link) => !link.permission || can(link.permission) || link.href === "/me");
}

export function bottomNavItems(can: (permission: string) => boolean): NavLink[] {
  const home: NavLink = can("reports.view")
    ? { href: "/dashboard", label: "Home", icon: Home, permission: "reports.view" }
    : { href: "/me", label: "Home", icon: Home };
  const shortcuts = BOTTOM_SHORTCUTS.map((href) => NAV_LINKS.find((link) => link.href === href)!)
    .filter((link) => !link.permission || can(link.permission))
    .map((link) => (link.href === "/nova" ? { ...link, label: "NOVA" } : link));
  return [home, ...shortcuts];
}

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function mobilePageTitle(pathname: string, appName: string, assistant: string) {
  if (pathname.startsWith("/tasks")) return "Task";
  if (pathname.startsWith("/projects")) return "Projects";
  const match = [...NAV_LINKS].sort((a, b) => b.href.length - a.href.length).find((link) => isNavActive(pathname, link.href));
  if (!match) return appName;
  return match.href === "/nova" ? assistant : match.label;
}
