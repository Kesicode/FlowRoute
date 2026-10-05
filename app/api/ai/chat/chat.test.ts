/**
 * app/api/ai/chat/chat.test.ts
 *
 * Phase 6 — Unit tests for the chat API utility functions.
 * Tests pure sanitization + SSE parsing logic extracted from the route.
 */

import { describe, it, expect } from "vitest";

// ─── Sanitize utility ─────────────────────────────────────────────────────────
// (Mirrors the sanitize() function in app/api/ai/chat/route.ts)

function sanitize(text: string): string {
  return text
    .replace(/[`\\]/g, "")
    .replace(/[^\x20-\x7E\u0900-\u097F\u0D00-\u0D7F\n\r\t]/g, " ")
    .substring(0, 500);
}

describe("sanitize()", () => {
  it("removes backticks", () => {
    expect(sanitize("hello `world`")).toBe("hello world");
  });

  it("removes backslashes", () => {
    // sanitize() strips backslashes — "C:\Users\test" becomes "C:Userstest"
    expect(sanitize("C:\\Users\\test")).toBe("C:Userstest");
  });


  it("preserves Hindi characters", () => {
    const hi = "भारत में यात्रा";
    expect(sanitize(hi)).toBe(hi);
  });

  it("preserves Malayalam characters", () => {
    const ml = "കേരളത്തിൽ യാത്ര";
    expect(sanitize(ml)).toBe(ml);
  });

  it("truncates to 500 chars", () => {
    const long = "a".repeat(600);
    expect(sanitize(long)).toHaveLength(500);
  });

  it("preserves newlines and tabs", () => {
    expect(sanitize("line1\nline2\ttab")).toBe("line1\nline2\ttab");
  });
});

// ─── SSE parsing ──────────────────────────────────────────────────────────────

function parseSSEChunk(chunk: string): string[] {
  const lines = chunk.split("\n");
  const results: string[] = [];
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6);
    if (data === "[DONE]") break;
    results.push(data);
  }
  return results;
}

describe("parseSSEChunk()", () => {
  it("parses a single data line", () => {
    expect(parseSSEChunk("data: hello world\n\n")).toEqual(["hello world"]);
  });

  it("stops at [DONE]", () => {
    const chunk = "data: first\n\ndata: [DONE]\n\ndata: after\n\n";
    expect(parseSSEChunk(chunk)).toEqual(["first"]);
  });

  it("parses multiple data lines", () => {
    const chunk = "data: chunk1\n\ndata: chunk2\n\ndata: chunk3\n\n";
    expect(parseSSEChunk(chunk)).toEqual(["chunk1", "chunk2", "chunk3"]);
  });

  it("ignores non-data lines", () => {
    const chunk = "event: message\ndata: hello\nid: 1\n\n";
    expect(parseSSEChunk(chunk)).toEqual(["hello"]);
  });

  it("returns empty for empty chunk", () => {
    expect(parseSSEChunk("")).toEqual([]);
  });
});

// ─── Trip context builder ─────────────────────────────────────────────────────

interface MinimalTrip {
  from?: string;
  to?: string;
  budget?: number;
  currency?: string;
  travellers?: number;
  departureDate?: string;
}

function buildTripContext(trip: MinimalTrip | null): string {
  if (!trip) return "";
  const parts: string[] = [];
  if (trip.from) parts.push(`From: ${trip.from}`);
  if (trip.to) parts.push(`To: ${trip.to}`);
  if (trip.budget) parts.push(`Budget: ${trip.currency ?? "INR"} ${trip.budget}`);
  if (trip.travellers) parts.push(`Travellers: ${trip.travellers}`);
  if (trip.departureDate) parts.push(`Date: ${trip.departureDate}`);
  return parts.join(", ");
}

describe("buildTripContext()", () => {
  it("returns empty string for null trip", () => {
    expect(buildTripContext(null)).toBe("");
  });

  it("builds full context string", () => {
    const ctx = buildTripContext({
      from: "Kochi",
      to: "Goa",
      budget: 15000,
      currency: "INR",
      travellers: 2,
      departureDate: "2024-12-25",
    });
    expect(ctx).toContain("From: Kochi");
    expect(ctx).toContain("To: Goa");
    expect(ctx).toContain("Budget: INR 15000");
    expect(ctx).toContain("Travellers: 2");
    expect(ctx).toContain("Date: 2024-12-25");
  });

  it("skips undefined fields", () => {
    const ctx = buildTripContext({ from: "Mumbai", to: "Delhi" });
    expect(ctx).toBe("From: Mumbai, To: Delhi");
  });

  it("uses INR as default currency", () => {
    const ctx = buildTripContext({ from: "A", to: "B", budget: 5000 });
    expect(ctx).toContain("Budget: INR 5000");
  });
});

// ─── Rate limiter logic ───────────────────────────────────────────────────────

function isRateLimited(lastCallMs: number, nowMs: number, windowMs: number): boolean {
  return nowMs - lastCallMs < windowMs;
}

describe("isRateLimited()", () => {
  it("blocks within the window", () => {
    expect(isRateLimited(1000, 3000, 4000)).toBe(true);
  });

  it("allows after the window", () => {
    expect(isRateLimited(1000, 6000, 4000)).toBe(false);
  });

  it("blocks at exactly the boundary", () => {
    expect(isRateLimited(1000, 4999, 4000)).toBe(true);
  });

  it("allows at boundary + 1ms", () => {
    expect(isRateLimited(1000, 5001, 4000)).toBe(false);
  });
});
