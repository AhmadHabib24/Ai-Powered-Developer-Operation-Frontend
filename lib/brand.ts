export const BRAND = {
  appName: "NEXORA",
  assistantName: "NORA",
  tagline: "AI-powered engineering operations",
  logo: {
    icon: "/fav-icon.png",
    dark: "/dark-logo.png",
    light: "/light-logo.png",
    wordmark: "/main-img-logo.png",
    nora: "/Nora-ai-assistence-logo.png",
  },
} as const;

export function brandAppName(value?: string | null) {
  const name = value?.trim();
  if (!name || name.toUpperCase() === "NOVA") {
    return process.env.NEXT_PUBLIC_APP_NAME || BRAND.appName;
  }
  return name;
}

export function brandAssistantName(value?: string | null) {
  const name = value?.trim();
  if (!name || name.toUpperCase() === "NOVA") {
    return process.env.NEXT_PUBLIC_ASSISTANT_NAME || BRAND.assistantName;
  }
  return name;
}
