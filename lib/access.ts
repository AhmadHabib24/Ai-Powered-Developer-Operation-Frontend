import { NAV_LINKS } from "@/lib/nav";
import type { CatalogPermission } from "@/types";

export const PERMISSION_GROUP_LABELS: Record<string, string> = {
  users: "People",
  access: "Roles",
  teams: "Teams",
  projects: "Projects",
  tasks: "Tasks",
  time: "Time",
  git: "Git",
  review: "Code review",
  reports: "Command / reports",
  performance: "Performance",
  ai: "NORA",
  audit: "Audit",
  notify: "Notifications",
  settings: "Settings",
};

export function sidebarLabelForPermission(slug: string): string | undefined {
  return NAV_LINKS.find((link) => link.permission === slug)?.label;
}

export function groupPermissions(catalog: CatalogPermission[]): { group: string; label: string; items: CatalogPermission[] }[] {
  const groups = new Map<string, CatalogPermission[]>();
  for (const item of catalog) {
    const current = groups.get(item.group) ?? [];
    current.push(item);
    groups.set(item.group, current);
  }

  return [...groups.entries()].map(([group, items]) => ({
    group,
    label: PERMISSION_GROUP_LABELS[group] ?? group,
    items,
  }));
}
