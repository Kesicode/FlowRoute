/**
 * source-cache.ts
 *
 * TTL-based in-memory cache with in-flight request deduplication and
 * stale-on-error fallback. Adapted from OSIRIS (MIT licence).
 *
 * Three behaviours:
 *   • TTL        — serve from memory until the data is plausibly stale.
 *   • dedup      — concurrent misses share one upstream fetch (no stampede).
 *   • stale-on-error — if the upstream fails, keep serving the last good data.
 */

interface Entry<T> {
  data: T[];
  expiresAt: number;
  inflight: Promise<T[]> | null;
}

const store = new Map<string, Entry<unknown>>();

export const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Cap on distinct cache keys. Callers with per-coordinate keys (e.g. Overpass
 * queries) would otherwise grow this map without bound.
 * Map preserves insertion order, so the oldest keys evict first.
 */
const MAX_ENTRIES = 500;

function evictIfNeeded(): void {
  if (store.size <= MAX_ENTRIES) return;
  for (const key of store.keys()) {
    if (store.size <= MAX_ENTRIES) break;
    const entry = store.get(key);
    if (entry?.inflight) continue; // never drop an in-flight request
    store.delete(key);
  }
}

/**
 * Wrap a fetcher with TTL caching, in-flight dedup, and stale fallback.
 * Returns a drop-in replacement with the same `() => Promise<T[]>` signature.
 *
 * @param key     Unique string key for this data source.
 * @param fetcher Async function that retrieves the data.
 * @param ttlMs   How long to serve cached data before refreshing (default 30 min).
 */
export function cachedSource<T>(
  key: string,
  fetcher: () => Promise<T[]>,
  ttlMs: number = DEFAULT_TTL_MS,
): () => Promise<T[]> {
  return async () => {
    const now = Date.now();
    const entry = store.get(key) as Entry<T> | undefined;

    // Fresh cache hit
    if (entry && now < entry.expiresAt && entry.data.length > 0) {
      return entry.data;
    }

    // Already in-flight — share the same promise
    if (entry?.inflight) return entry.inflight;

    const inflight = (async () => {
      try {
        const data = await fetcher();
        // Empty result treated as failed refresh — keep stale data
        if (data.length === 0 && entry?.data.length) {
          store.set(key, { data: entry.data, expiresAt: now + ttlMs, inflight: null });
          return entry.data;
        }
        store.set(key, { data, expiresAt: now + ttlMs, inflight: null });
        return data;
      } catch (err) {
        if (entry?.data.length) {
          // Serve stale data but retry sooner than a full TTL
          console.warn(`[FlowRoute/cache] ${key} refresh failed — serving ${entry.data.length} stale items`);
          store.set(key, { data: entry.data, expiresAt: now + 60_000, inflight: null });
          return entry.data;
        }
        console.warn(`[FlowRoute/cache] ${key} fetch failed with no cache:`, err);
        store.set(key, { data: [], expiresAt: now + 60_000, inflight: null });
        return [];
      }
    })();

    store.set(key, {
      data: entry?.data ?? [],
      expiresAt: entry?.expiresAt ?? 0,
      inflight,
    } as Entry<unknown>);
    evictIfNeeded();

    return inflight;
  };
}

/**
 * Read a source without triggering a fetch.
 * Useful for checking what's already in the cache before making a request.
 */
export function peekSource<T>(key: string, allowStale = false): T[] | undefined {
  const entry = store.get(key) as Entry<T> | undefined;
  if (!entry || entry.data.length === 0) return undefined;
  if (allowStale || Date.now() < entry.expiresAt) return entry.data;
  return undefined;
}

/**
 * Seed the cache with pre-fetched data (e.g. server-side data passed to client).
 * No-op if a live fetch is already in progress.
 */
export function seedSource<T>(key: string, data: T[], ttlMs: number = DEFAULT_TTL_MS): void {
  if (!data.length) return;
  const entry = store.get(key);
  if (entry?.inflight) return; // live fetch takes priority
  store.set(key, { data, expiresAt: Date.now() + ttlMs, inflight: null } as Entry<unknown>);
  evictIfNeeded();
}

/** Returns true if the cached entry is missing or past its TTL. */
export function isStale(key: string): boolean {
  const entry = store.get(key);
  return !entry || Date.now() >= entry.expiresAt;
}

/** Test seam — clears all cached entries. */
export function clearSourceCache(): void {
  store.clear();
}
