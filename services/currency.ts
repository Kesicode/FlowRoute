/**
 * services/currency.ts
 *
 * Phase 3 — Multi-Currency Live Conversion Engine
 *
 * Architecture:
 *   1. Fetch live rates from the FREE exchangerate-api.com open endpoint
 *      (no API key required, rate-limited at ~1500 req/month per IP).
 *   2. Cache results in localStorage for 12 hours (TTL) so travelers keep
 *      working rates even when offline mid-journey.
 *   3. Fall back to hardcoded conservative rates if both live fetch and
 *      localStorage cache fail — always returns a valid number.
 *
 * No API keys. No backend proxies. Zero cost.
 */

export type SupportedCurrency = "INR" | "USD" | "EUR" | "GBP" | "AED" | "JPY" | "SGD" | "AUD";

// ─── Fallback Rates (relative to INR as base, updated 2026-Q1) ────────────────
// Used when network is unavailable and localStorage is empty.
const FALLBACK_RATES_TO_INR: Record<SupportedCurrency, number> = {
  INR: 1,
  USD: 83.5,
  EUR: 90.2,
  GBP: 105.8,
  AED: 22.7,
  JPY: 0.55,
  SGD: 61.5,
  AUD: 54.0,
};

// ─── Rate Cache Shape ──────────────────────────────────────────────────────────

interface RateCache {
  base: "INR";
  rates: Record<string, number>; // how many INR per 1 unit of that currency
  fetchedAt: number;              // Unix timestamp ms
  source: "live" | "cache" | "fallback";
}

const CACHE_KEY = "flowroute_fx_v1";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// In-memory copy so we only hit localStorage once per session
let memCache: RateCache | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFallbackRates(): RateCache {
  return {
    base: "INR",
    rates: { ...FALLBACK_RATES_TO_INR } as Record<string, number>,
    fetchedAt: 0,
    source: "fallback",
  };
}

function loadFromStorage(): RateCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RateCache;
    // Validate shape minimally
    if (!parsed.rates || !parsed.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(cache: RateCache): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full — silently ignore
  }
}

function isFresh(cache: RateCache): boolean {
  return Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

// ─── Live Rate Fetcher ────────────────────────────────────────────────────────

/**
 * Fetches live exchange rates from the free exchangerate-api.com endpoint.
 * Returns rates expressed as "INR per 1 unit of foreign currency".
 * Throws on network error so callers can fall back gracefully.
 */
async function fetchLiveRates(): Promise<RateCache> {
  // Free endpoint: base USD, no API key required
  // We fetch USD-base then convert everything to INR-base for consistency
  const res = await fetch("https://open.er-api.com/v6/latest/INR", {
    signal: AbortSignal.timeout(8000), // 8s timeout
  });

  if (!res.ok) throw new Error(`FX API ${res.status}`);

  const json = await res.json() as {
    result: string;
    rates: Record<string, number>; // rates[X] = how many X per 1 INR
    time_last_update_utc?: string;
  };

  if (json.result !== "success") throw new Error("FX API returned non-success");

  // json.rates[X] = X per 1 INR
  // We need INR per 1 X = 1 / json.rates[X]
  const ratesInINR: Record<string, number> = {};
  for (const [code, perINR] of Object.entries(json.rates)) {
    ratesInINR[code] = perINR > 0 ? 1 / perINR : 0;
  }
  ratesInINR["INR"] = 1;

  return {
    base: "INR",
    rates: ratesInINR,
    fetchedAt: Date.now(),
    source: "live",
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the current exchange rates, preferring:
 *   1. In-memory cache (same session, still fresh)
 *   2. localStorage cache (persisted, still fresh)
 *   3. Live fetch (network available)
 *   4. Stale localStorage (network failed)
 *   5. Hardcoded fallbacks
 *
 * Never throws — always returns a usable RateCache.
 */
export async function getRates(): Promise<RateCache> {
  // 1. Memory cache — fastest
  if (memCache && isFresh(memCache)) return memCache;

  // 2. localStorage cache
  const stored = loadFromStorage();
  if (stored && isFresh(stored)) {
    memCache = stored;
    return stored;
  }

  // 3. Live fetch
  try {
    const live = await fetchLiveRates();
    memCache = live;
    saveToStorage(live);
    return live;
  } catch {
    // Network failed — fall through
  }

  // 4. Stale localStorage (better than fallback if available)
  if (stored) {
    memCache = { ...stored, source: "cache" };
    return memCache;
  }

  // 5. Hardcoded fallback
  const fallback = getFallbackRates();
  memCache = fallback;
  return fallback;
}

// ─── Conversion Utilities ─────────────────────────────────────────────────────

export interface ConversionResult {
  amount: number;
  fromCurrency: SupportedCurrency | string;
  toCurrency: SupportedCurrency | string;
  rate: number;           // 1 fromCurrency = rate toCurrency
  rateSource: "live" | "cache" | "fallback";
  rateAgeHours: number;   // How old the rate data is
}

/**
 * Converts an amount from one currency to another.
 * Uses cached rates; fetches live rates in background if stale.
 * For SSR / server contexts, returns the fallback rates synchronously.
 */
export async function convert(
  amount: number,
  from: SupportedCurrency | string,
  to: SupportedCurrency | string
): Promise<ConversionResult> {
  if (from === to) {
    return { amount, fromCurrency: from, toCurrency: to, rate: 1, rateSource: "live", rateAgeHours: 0 };
  }

  const cache = await getRates();

  // Both rates are "INR per 1 unit"
  const fromInINR = cache.rates[from] ?? FALLBACK_RATES_TO_INR[from as SupportedCurrency] ?? 1;
  const toInINR   = cache.rates[to]   ?? FALLBACK_RATES_TO_INR[to as SupportedCurrency]   ?? 1;

  // Convert: amount * fromInINR gives INR, then / toInINR gives target
  const converted = (amount * fromInINR) / toInINR;
  const rate = fromInINR / toInINR;
  const rateAgeHours = cache.fetchedAt > 0
    ? Math.round((Date.now() - cache.fetchedAt) / 3_600_000)
    : Infinity;

  return {
    amount: Math.round(converted * 100) / 100,
    fromCurrency: from,
    toCurrency: to,
    rate: Math.round(rate * 10000) / 10000,
    rateSource: cache.source,
    rateAgeHours,
  };
}

/**
 * Synchronous conversion using in-memory fallback rates only.
 * Use when you cannot await (e.g. render-time calculations).
 * Less accurate than async convert() but always available.
 */
export function convertSync(
  amount: number,
  from: SupportedCurrency | string,
  to: SupportedCurrency | string
): number {
  if (from === to) return amount;

  // Try memory cache first, then fallback rates
  const rateMap = memCache?.rates ?? FALLBACK_RATES_TO_INR;
  const fromInINR = rateMap[from] ?? FALLBACK_RATES_TO_INR[from as SupportedCurrency] ?? 1;
  const toInINR   = rateMap[to]   ?? FALLBACK_RATES_TO_INR[to as SupportedCurrency]   ?? 1;

  return Math.round(((amount * fromInINR) / toInINR) * 100) / 100;
}

// ─── Formatting Utilities ─────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  JPY: "¥",
  SGD: "S$",
  AUD: "A$",
};

const LOCALE_MAP: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "ar-AE",
  JPY: "ja-JP",
  SGD: "en-SG",
  AUD: "en-AU",
};

/**
 * Formats a currency amount as a human-readable string.
 * Uses the platform's Intl.NumberFormat when available.
 *
 * @example formatCurrency(15000, "INR")  => "₹15,000"
 * @example formatCurrency(180.5, "USD")  => "$180.50"
 */
export function formatCurrency(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency + " ";
  const locale = LOCALE_MAP[currency] ?? "en-US";

  // JPY doesn't have decimal places
  const decimals = currency === "JPY" ? 0 : 2;
  const minDecimals = currency === "INR" ? 0 : 2; // INR: drop .00

  try {
    if (typeof Intl !== "undefined") {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: decimals,
      }).format(amount);
    }
  } catch {
    // Intl not available or unsupported currency
  }

  // Manual fallback
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: decimals,
  });
  return `${sym}${formatted}`;
}

/**
 * Returns a short tooltip-style rate string.
 * @example rateTooltip("USD", "INR", 83.5) => "1 USD = ₹83.50"
 */
export function rateTooltip(from: string, to: string, rate: number): string {
  const toSym = CURRENCY_SYMBOLS[to] ?? to + " ";
  return `1 ${from} = ${toSym}${rate.toFixed(2)}`;
}

/**
 * Preloads exchange rates into memory and localStorage.
 * Call once on app mount (e.g. in StoreHydration) so rates are warm
 * before any component needs them.
 */
export async function preloadRates(): Promise<void> {
  try {
    await getRates();
  } catch {
    // Non-fatal — fallback rates will be used
  }
}
