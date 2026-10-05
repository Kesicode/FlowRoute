import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { SettingsProvider } from "@/lib/settings-context";
import EmergencyOverlay from "@/components/emergency-overlay";
import { StoreHydration } from "@/components/StoreHydration";
// Phase 5 — PWA
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
// Phase 8 — PWA update notification
import { PWAUpdateToast } from "@/components/ui/PWAUpdateToast";

export const metadata: Metadata = {
  title: "FlowRoute | AI-Powered Mobility Operating System",
  description:
    "An intelligent journey planning platform combining live maps, weather intelligence, route optimization, and AI reasoning to recommend the most suitable journey.",
  keywords: [
    "flowroute",
    "mobility",
    "route optimizer",
    "transit",
    "weather route planning",
    "AI journey explanation",
    "offline travel planner",
    "PWA travel app",
  ],
  authors: [{ name: "FlowRoute Team" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FlowRoute",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#00f2fe" },
    { media: "(prefers-color-scheme: light)", color: "#00b4d8" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Language is set client-side by Zustand — default to "en" for SSR
    <html lang="en" className="dark h-full">
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col font-sans overflow-x-hidden selection:bg-primary/20 selection:text-primary">
        <SettingsProvider>
          <StoreHydration />
          <OfflineBanner />
          <Navbar />
          <main className="flex-grow flex flex-col pt-[72px]">
            {children}
          </main>
          <Footer />
          <EmergencyOverlay />
          {/* Phase 5 — Install prompt appears above bottom nav on mobile */}
          <InstallPrompt />
          {/* Phase 8 — SW update available notification */}
          <PWAUpdateToast />
        </SettingsProvider>
      </body>
    </html>
  );
}
