"use client";

import { useAuth } from "@/providers/auth-provider";
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
    router.replace(user.permissions?.includes("projects.delete") ? "/dashboard" : "/me");
  }, [user, isLoading, router]);

  return <div className="text-slate-400">Opening workspace…</div>;
}
