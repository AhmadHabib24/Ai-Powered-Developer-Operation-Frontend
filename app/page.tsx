"use client";

import { useAuth } from "@/providers/auth-provider";
import { userCanOpenCommand } from "@/lib/nav";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(userCanOpenCommand(user.permissions) ? "/dashboard" : "/me");
  }, [user, isLoading, router]);

  return <div className="text-muted">Opening workspace…</div>;
}
