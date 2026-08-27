import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { BRAND } from "@/lib/brand";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
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
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <Toaster theme="dark" position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
