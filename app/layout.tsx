import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppToaster } from "@/components/layout/app-toaster";
import { AppShell } from "@/components/layout/app-shell";
import { BRAND } from "@/lib/brand";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: `${BRAND.appName} — ${BRAND.tagline}`,
  description: BRAND.tagline,
  icons: {
    icon: [{ url: BRAND.logo.icon, type: "image/png" }],
    apple: BRAND.logo.icon,
    shortcut: BRAND.logo.icon,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
              <AppToaster />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
