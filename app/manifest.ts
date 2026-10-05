/**
 * app/manifest.ts
 *
 * Phase 5 — PWA Web App Manifest
 * Next.js native App Router manifest — served at /manifest.webmanifest automatically.
 * No public/manifest.json needed (this supersedes it).
 */

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FlowRoute — AI Travel Planner",
    short_name: "FlowRoute",
    description:
      "AI-powered multilingual travel planner for India. Plan trips, compare routes, book travel — works offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#00f2fe",
    orientation: "portrait-primary",
    scope: "/",
    lang: "en",
    categories: ["travel", "navigation", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        // @ts-expect-error — purpose is valid in manifest spec but may not be in older TS types
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        // @ts-expect-error — purpose field is valid in the W3C PWA manifest spec but missing from Next.js types

        purpose: "any maskable",
      },
    ],
    // @ts-expect-error — shortcuts is valid manifest field
    shortcuts: [
      {
        name: "Plan a Trip",
        short_name: "Plan",
        description: "Start planning a new journey with AI",
        url: "/planner",
      },
      {
        name: "My Journey",
        short_name: "Journey",
        description: "View your active journey map and itinerary",
        url: "/journey",
      },
      {
        name: "Explore Nearby",
        short_name: "Explore",
        description: "Discover hotels, restaurants and attractions",
        url: "/explore",
      },
      {
        name: "Emergency SOS",
        short_name: "SOS",
        description: "Emergency contacts and nearest hospitals",
        url: "/emergency",
      },
    ],
  };
}
