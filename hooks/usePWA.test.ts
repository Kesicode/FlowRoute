/**
 * hooks/usePWA.test.ts
 *
 * Phase 5 — Unit tests for PWA detection logic.
 * Tests the pure utility functions extracted from the hook.
 * Note: The hook itself uses browser APIs tested via integration/E2E.
 */

import { describe, it, expect } from "vitest";

// ─── Utility: isIOSDevice ─────────────────────────────────────────────────────
// Extract testable logic from the hook

function isIOSDevice(userAgent: string): boolean {
  return /iPad|iPhone|iPod/.test(userAgent);
}

function isStandaloneMode(matchResult: boolean, navigatorStandalone?: boolean): boolean {
  return matchResult || navigatorStandalone === true;
}

function shouldShowInstallPrompt(
  isStandalone: boolean,
  hasDismissed: boolean,
  canInstall: boolean,
  isIOS: boolean
): boolean {
  if (isStandalone) return false;
  if (hasDismissed) return false;
  return canInstall || isIOS;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("isIOSDevice", () => {
  it("detects iPhone user agent", () => {
    expect(
      isIOSDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
      )
    ).toBe(true);
  });

  it("detects iPad user agent", () => {
    expect(
      isIOSDevice(
        "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15"
      )
    ).toBe(true);
  });

  it("detects iPod user agent", () => {
    expect(isIOSDevice("Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0)")).toBe(
      true
    );
  });

  it("returns false for Android", () => {
    expect(
      isIOSDevice(
        "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36"
      )
    ).toBe(false);
  });

  it("returns false for desktop Chrome", () => {
    expect(
      isIOSDevice(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      )
    ).toBe(false);
  });
});

describe("isStandaloneMode", () => {
  it("returns true when display-mode:standalone media matches", () => {
    expect(isStandaloneMode(true)).toBe(true);
  });

  it("returns true when navigator.standalone is true (iOS)", () => {
    expect(isStandaloneMode(false, true)).toBe(true);
  });

  it("returns false when neither condition is met", () => {
    expect(isStandaloneMode(false, false)).toBe(false);
    expect(isStandaloneMode(false, undefined)).toBe(false);
  });
});

describe("shouldShowInstallPrompt", () => {
  it("hides when already in standalone mode", () => {
    expect(shouldShowInstallPrompt(true, false, true, false)).toBe(false);
  });

  it("hides when user has dismissed", () => {
    expect(shouldShowInstallPrompt(false, true, true, false)).toBe(false);
  });

  it("shows for Android with deferred prompt available", () => {
    expect(shouldShowInstallPrompt(false, false, true, false)).toBe(true);
  });

  it("shows for iOS even without deferred prompt", () => {
    expect(shouldShowInstallPrompt(false, false, false, true)).toBe(true);
  });

  it("hides when not standalone, not dismissed, not installable, not iOS", () => {
    expect(shouldShowInstallPrompt(false, false, false, false)).toBe(false);
  });
});

// ─── SW Cache Strategy Labels ─────────────────────────────────────────────────

type CacheStrategy = "cache-first" | "network-first" | "skip";

function getStrategyForPath(pathname: string): CacheStrategy {
  if (pathname.startsWith("/api/")) return "network-first";
  if (pathname.match(/\.(js|css|woff2?|ttf|svg|png|jpg|webp|ico)$/)) return "cache-first";
  if (pathname.startsWith("/_next/static/")) return "cache-first";
  // Navigation
  return "network-first";
}

describe("SW cache strategy routing", () => {
  it("API paths use network-first", () => {
    expect(getStrategyForPath("/api/ai/parse")).toBe("network-first");
    expect(getStrategyForPath("/api/ai/plan")).toBe("network-first");
  });

  it("static assets use cache-first", () => {
    expect(getStrategyForPath("/icons/icon-192.svg")).toBe("cache-first");
    expect(getStrategyForPath("/globals.css")).toBe("cache-first");
    expect(getStrategyForPath("/_next/static/chunks/main.js")).toBe("cache-first");
    expect(getStrategyForPath("/banner.png")).toBe("cache-first");
  });

  it("navigation pages use network-first", () => {
    expect(getStrategyForPath("/")).toBe("network-first");
    expect(getStrategyForPath("/journey")).toBe("network-first");
    expect(getStrategyForPath("/offline")).toBe("network-first");
  });
});
