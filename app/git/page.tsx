"use client";

import { GitWorkspace } from "@/components/git/git-workspace";
import { Suspense } from "react";

export default function GitPage() {
  return (
    <Suspense fallback={<p className="text-slate-400">Loading GitHub…</p>}>
      <GitWorkspace />
    </Suspense>
  );
}
