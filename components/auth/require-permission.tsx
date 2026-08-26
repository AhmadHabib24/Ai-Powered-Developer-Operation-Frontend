"use client";

import { useAuth } from "@/providers/auth-provider";

export function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { can, isLoading } = useAuth();

  if (isLoading) return <p className="text-slate-400">Loading…</p>;
  if (!can(permission)) {
    return <p className="text-rose-300">You do not have permission to view this.</p>;
  }

  return children;
}
