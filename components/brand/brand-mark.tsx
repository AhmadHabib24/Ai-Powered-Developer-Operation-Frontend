import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Mark = keyof typeof BRAND.logo;

export function BrandMark({
  variant = "dark",
  alt,
  className,
}: {
  variant?: Mark;
  alt?: string;
  className?: string;
}) {
  const labels: Record<Mark, string> = {
    icon: BRAND.appName,
    dark: BRAND.appName,
    light: BRAND.appName,
    wordmark: `${BRAND.appName} — ${BRAND.tagline}`,
    nora: `${BRAND.assistantName} AI assistant`,
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={BRAND.logo[variant]} alt={alt ?? labels[variant]} className={cn("object-contain", className)} />
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-[0.28em] text-white", className)}>
      NE
      <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">X</span>
      ORA
    </span>
  );
}
