import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { SettingsProvider } from "@/lib/settings-context";
import EmergencyOverlay from "@/components/emergency-overlay";
import { StoreHydration } from "@/components/StoreHydration";


export const metadata: Metadata = {
  title: "FlowRoute | AI-Powered Mobility Operating System",
  description: "An intelligent journey planning platform combining live maps, weather intelligence, route optimization, and AI reasoning to recommend the most suitable journey.",
  keywords: ["flowroute", "mobility", "route optimizer", "transit", "weather route planning", "AI journey explanation"],
  authors: [{ name: "FlowRoute Team" }],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("flowroute_lang")?.value ?? "en";
  const validLang = ["en", "hi", "ml"].includes(lang) ? lang : "en";
  return (
    <html lang={validLang} className="dark h-full">
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col font-sans overflow-x-hidden selection:bg-primary/20 selection:text-primary">
        <SettingsProvider>
          <StoreHydration />
          <Navbar />
          <main className="flex-grow flex flex-col pt-[72px]">
            {children}
          </main>
          <Footer />
          <EmergencyOverlay />
        </SettingsProvider>
      </body>
    </html>
  );
}


