"use client";

import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Mark = keyof typeof BRAND.logo;

export function BrandMark({
  variant,
  alt,
  className,
}: {
  variant?: Mark;
  alt?: string;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const auto: Mark = !ready || resolvedTheme === "dark" ? "dark" : "light";
  const chosen = variant ?? auto;
  const labels: Record<Mark, string> = {
    icon: BRAND.appName,
    dark: BRAND.appName,
    light: BRAND.appName,
    wordmark: `${BRAND.appName} — ${BRAND.tagline}`,
    nora: `${BRAND.assistantName} AI assistant`,
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={BRAND.logo[chosen]} alt={alt ?? labels[chosen]} className={cn("object-contain", className)} />
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-[0.28em] text-foreground", className)}>
      NE
      <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">X</span>
      ORA
    </span>
  );
}
