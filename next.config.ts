import type { NextConfig } from "next";

/**
 * next.config.ts
 *
 * Phase 5 — PWA security headers + service worker cache control
 */

const nextConfig: NextConfig = {
  typescript: {
    // TS errors are reported by eslint/CI — don't fail Vercel builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint runs separately in CI; don't block Vercel builds
    ignoreDuringBuilds: true,
  },
  turbopack: {
    // Silence "multiple lockfiles" warning — project root is FlowRoute/
    root: __dirname,
  },

  // Phase 5 — Security headers + SW headers
  async headers() {
    return [
      {
        // Global security headers
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        // Service worker: always up-to-date, never cached by browser
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        // Manifest: short cache OK, browsers re-fetch on updates
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
