import { describe, it, expect, beforeEach } from "vitest";
import {
  cachedSource,
  peekSource,
  seedSource,
  isStale,
  clearSourceCache,
} from "@/lib/source-cache";

beforeEach(() => {
  clearSourceCache();
});

describe("cachedSource", () => {
  it("calls fetcher on first request and returns data", async () => {
    let callCount = 0;
    const fetch = cachedSource("test-key", async () => {
      callCount++;
      return [{ id: 1 }];
    });

    const result = await fetch();
    expect(result).toEqual([{ id: 1 }]);
    expect(callCount).toBe(1);
  });

  it("serves cached data on second request within TTL", async () => {
    let callCount = 0;
    const fetch = cachedSource("test-cache", async () => {
      callCount++;
      return [{ id: 2 }];
    });

    await fetch();
    await fetch();
    expect(callCount).toBe(1); // only fetched once
  });

  it("deduplicates concurrent in-flight requests", async () => {
    let callCount = 0;
    const fetch = cachedSource("test-dedup", async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 10)); // simulate latency
      return [{ id: 3 }];
    });

    // Fire two concurrent requests
    const [r1, r2] = await Promise.all([fetch(), fetch()]);
    expect(r1).toEqual([{ id: 3 }]);
    expect(r2).toEqual([{ id: 3 }]);
    expect(callCount).toBe(1); // only one upstream call
  });

  it("returns stale data on upstream error when cache exists", async () => {
    const stale = [{ id: "stale" }];
    seedSource("test-stale", stale, 60_000);

    const shouldFail = true;
    const fetch = cachedSource("test-stale", async () => {
      if (shouldFail) throw new Error("upstream down");
      return [{ id: "fresh" }];
    }, 1); // TTL=1ms so cache expires immediately

    await new Promise((r) => setTimeout(r, 5)); // let TTL expire
    const result = await fetch();
    expect(result).toEqual(stale);
  });

  it("returns empty array when upstream fails with no cache", async () => {
    const fetch = cachedSource("test-empty", async () => {
      throw new Error("no data");
    });
    const result = await fetch();
    expect(result).toEqual([]);
  });
});

describe("peekSource", () => {
  it("returns undefined when key not cached", () => {
    expect(peekSource("missing")).toBeUndefined();
  });

  it("returns cached data when fresh", () => {
    seedSource("peek-key", [{ id: 99 }], 60_000);
    expect(peekSource("peek-key")).toEqual([{ id: 99 }]);
  });
});

describe("isStale", () => {
  it("returns true for unknown key", () => {
    expect(isStale("unknown")).toBe(true);
  });

  it("returns false for freshly seeded key", () => {
    seedSource("fresh-key", [{ id: 1 }], 60_000);
    expect(isStale("fresh-key")).toBe(false);
  });
});
