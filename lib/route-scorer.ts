/**
 * route-scorer.ts
 *
 * Scores a candidate route against an optimization mode.
 * Returns a 0–100 score plus a per-factor breakdown and recommendation.
 *
 * Pure functions. No side effects. No Next.js imports.
 */

import type { OptimizationMode } from "@/types/trip";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteInput {
  /** Travel time in minutes */
  durationMinutes: number;
  /** Total distance in km */
  distanceKm: number;
  /** Estimated cost (in user's currency) */
  cost: number;
  /** Estimated carbon footprint in kg CO₂ */
  carbonKg: number;
  /** Total walking distance in km */
  walkingKm: number;
  /** Number of mode transfers */
  transfers: number;
  /** Weather severity on route: 0 = clear, 1 = severe */
  weatherSeverity: number;
  /** Whether the route is fully wheelchair accessible */
  accessible: boolean;
  /** Whether the route passes scenic/viewpoint locations */
  scenic: boolean;
}

export interface RouteScoreBreakdown {
  time: number;        // 0-100 (higher = faster)
  cost: number;        // 0-100 (higher = cheaper)
  carbon: number;      // 0-100 (higher = lower emissions)
  comfort: number;     // 0-100 (higher = fewer transfers + less walking)
  accessibility: number; // 0-100
  scenicness: number;  // 0-100
}

export interface RouteScore {
  total: number;           // 0-100 weighted score for this mode
  breakdown: RouteScoreBreakdown;
  recommendation: string;  // Human-readable summary
  mode: OptimizationMode;
}

// ─── Scoring Weights per Optimization Mode ────────────────────────────────────

const WEIGHTS: Record<OptimizationMode, Partial<Record<keyof RouteScoreBreakdown, number>>> = {
  fastest:     { time: 0.6, cost: 0.1, carbon: 0.05, comfort: 0.2, accessibility: 0.05, scenicness: 0 },
  cheapest:    { time: 0.1, cost: 0.6, carbon: 0.1,  comfort: 0.1, accessibility: 0.05, scenicness: 0.05 },
  eco:         { time: 0.1, cost: 0.15, carbon: 0.6, comfort: 0.1, accessibility: 0.05, scenicness: 0 },
  comfortable: { time: 0.2, cost: 0.15, carbon: 0.05, comfort: 0.5, accessibility: 0.1, scenicness: 0 },
  scenic:      { time: 0.1, cost: 0.1, carbon: 0.05, comfort: 0.15, accessibility: 0.1, scenicness: 0.5 },
  accessible:  { time: 0.15, cost: 0.1, carbon: 0.05, comfort: 0.2, accessibility: 0.5, scenicness: 0 },
};

// ─── Normalisation helpers ────────────────────────────────────────────────────

/** Normalise a value where lower is better (returns 0-100, 100 = best). */
function normalizeLowerBetter(value: number, max: number): number {
  if (max === 0) return 100;
  return Math.max(0, Math.min(100, Math.round((1 - value / max) * 100)));
}

/** Normalise a boolean to 0 or 100. */
function normalizeBool(value: boolean): number {
  return value ? 100 : 0;
}

// ─── scoreRoute ───────────────────────────────────────────────────────────────

/**
 * Scores a route for a given optimization mode.
 *
 * Reference maxima are calibrated for a typical 500 km trip.
 * Adjust as real data arrives.
 */
export function scoreRoute(
  route: RouteInput,
  mode: OptimizationMode
): RouteScore {
  const breakdown: RouteScoreBreakdown = {
    time:          normalizeLowerBetter(route.durationMinutes, 900),  // max ~15 h
    cost:          normalizeLowerBetter(route.cost, 15_000),          // max ₹15,000
    carbon:        normalizeLowerBetter(route.carbonKg, 200),         // max 200 kg CO₂
    comfort:       computeComfortScore(route),
    accessibility: normalizeBool(route.accessible),
    scenicness:    normalizeBool(route.scenic),
  };

  const weights = WEIGHTS[mode];
  const total = Math.round(
    Object.entries(breakdown).reduce((sum, [key, val]) => {
      return sum + val * (weights[key as keyof RouteScoreBreakdown] ?? 0);
    }, 0)
  );

  return {
    total,
    breakdown,
    recommendation: buildRecommendation(mode, route, total),
    mode,
  };
}

function computeComfortScore(route: RouteInput): number {
  const transferPenalty = normalizeLowerBetter(route.transfers, 5);   // max 5 transfers
  const walkingPenalty  = normalizeLowerBetter(route.walkingKm, 5);   // max 5 km walking
  const weatherPenalty  = normalizeLowerBetter(route.weatherSeverity, 1);
  return Math.round((transferPenalty + walkingPenalty + weatherPenalty) / 3);
}

function buildRecommendation(mode: OptimizationMode, route: RouteInput, score: number): string {
  const grade = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor";
  const highlights: string[] = [];

  if (mode === "fastest") highlights.push(`${route.durationMinutes}min travel time`);
  if (mode === "cheapest") highlights.push(`estimated cost: ₹${route.cost.toLocaleString()}`);
  if (mode === "eco") highlights.push(`${route.carbonKg}kg CO₂`);
  if (mode === "comfortable") highlights.push(`${route.transfers} transfer${route.transfers === 1 ? "" : "s"}`);
  if (mode === "scenic" && route.scenic) highlights.push("scenic route");
  if (mode === "accessible" && route.accessible) highlights.push("fully accessible");

  return `${grade} for ${mode}${highlights.length ? ` — ${highlights.join(", ")}` : ""}`;
}
