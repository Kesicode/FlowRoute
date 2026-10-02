/**
 * budget-engine.ts
 *
 * Pure functions for trip budget estimation, risk assessment,
 * and cheaper-alternative suggestions.
 *
 * All monetary amounts are currency-qualified — never bare numbers.
 * All outputs are flagged isDemoEstimate: true until real provider data arrives.
 */

import type { TripIntent, BudgetAllocation, BudgetRisk, MonetaryAmount } from "@/types/trip";

// ─── Estimation Tables ────────────────────────────────────────────────────────
// These are illustrative fallback values used when no real provider is available.
// They are shown to the user with an explicit "Estimated" disclaimer.

/** Average cost per traveller per km for each transport mode (in INR) */
const TRANSPORT_COST_PER_KM_INR: Record<string, number> = {
  bus: 0.5,
  train: 1.2,
  airplane: 4.5,
  ferry: 2.0,
  taxi: 8.0,
  rideshare: 6.0,
  metro: 1.0,
  walk: 0,
  bike: 0,
  bicycle: 0,
  motorcycle: 2.0,
  car: 3.5,
  tram: 0.8,
};

/** Approximate distance multipliers to major Indian destinations (from any origin) */
const DEMO_TRIP_DISTANCES_KM: Record<string, number> = {
  default: 500,
};

/** Daily accommodation cost per room in INR */
const ACCOMMODATION_COST_PER_NIGHT_INR: Record<string, number> = {
  hotel: 2500,
  hostel: 600,
  apartment: 1800,
  camping: 400,
  flexible: 1500,
};

/** Daily food cost per traveller in INR */
const FOOD_COST_PER_DAY_PER_PERSON_INR = 500;

/** Activity cost per person per day in INR */
const ACTIVITY_COST_PER_DAY_PER_PERSON_INR = 300;

/** Reserve percentage of total */
const RESERVE_FRACTION = 0.1;

/** USD/EUR/GBP conversion (illustrative only) */
const CURRENCY_MULTIPLIER: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
};

function convertFromINR(amountInr: number, currency: string): number {
  return Math.round(amountInr * (CURRENCY_MULTIPLIER[currency] ?? 1));
}

function makeAmount(amountInr: number, currency: string): MonetaryAmount {
  return { amount: convertFromINR(amountInr, currency), currency };
}

// ─── estimateBudget ───────────────────────────────────────────────────────────

/**
 * Generates a rough budget allocation for a trip.
 * All figures are demo estimates — real provider data replaces these in Phase 3.
 */
export function estimateBudget(intent: TripIntent): BudgetAllocation {
  const { travellers, currency, accommodationPreference } = intent;

  const tripDays = computeTripDays(intent);
  const distKm = DEMO_TRIP_DISTANCES_KM[intent.to.toLowerCase()] ?? DEMO_TRIP_DISTANCES_KM.default;

  // Transport (outbound + return × travellers)
  const transportRatePerKm = TRANSPORT_COST_PER_KM_INR["train"]; // default to train estimate
  const transportInr = distKm * transportRatePerKm * travellers * 2; // ×2 for return

  // Accommodation (nights = tripDays - 1, min 0)
  const nights = Math.max(0, tripDays - 1);
  const roomCostPerNight = ACCOMMODATION_COST_PER_NIGHT_INR[accommodationPreference ?? "flexible"];
  const rooms = travellers <= 2 ? 1 : Math.ceil(travellers / 2);
  const accommodationInr = nights * roomCostPerNight * rooms;

  // Food
  const foodInr = tripDays * FOOD_COST_PER_DAY_PER_PERSON_INR * travellers;

  // Activities
  const activitiesInr = tripDays * ACTIVITY_COST_PER_DAY_PER_PERSON_INR * travellers;

  // Reserve
  const subtotalInr = transportInr + accommodationInr + foodInr + activitiesInr;
  const reserveInr = Math.round(subtotalInr * RESERVE_FRACTION);

  return {
    transport: makeAmount(transportInr, currency),
    accommodation: makeAmount(accommodationInr, currency),
    food: makeAmount(foodInr, currency),
    activities: makeAmount(activitiesInr, currency),
    reserve: makeAmount(reserveInr, currency),
    isDemoEstimate: true,
  };
}

function computeTripDays(intent: TripIntent): number {
  if (!intent.departureDate) return 1;
  if (!intent.returnDate) return 1;
  const start = new Date(intent.departureDate);
  const end = new Date(intent.returnDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

// ─── getBudgetRisk ────────────────────────────────────────────────────────────

/**
 * Computes budget risk based on what has been committed vs. the total allocation.
 *
 * @param allocation  The estimated budget breakdown.
 * @param spentAmount How much has been committed so far (same currency as allocation).
 */
export function getBudgetRisk(allocation: BudgetAllocation, spentAmount: number): BudgetRisk {
  const totalBudget =
    allocation.transport.amount +
    allocation.accommodation.amount +
    allocation.food.amount +
    allocation.activities.amount +
    allocation.reserve.amount;

  if (totalBudget === 0) return "safe";

  const ratio = spentAmount / totalBudget;

  if (ratio >= 1.0) return "over";
  if (ratio >= 0.8) return "warning";
  return "safe";
}

// ─── suggestCheaperAlternative ────────────────────────────────────────────────

export interface CheaperSuggestion {
  field: "transport" | "accommodation" | "food" | "activities";
  currentCost: MonetaryAmount;
  suggestedCost: MonetaryAmount;
  suggestion: string;
}

/**
 * Given a budget allocation, returns the single biggest saving suggestion,
 * or null if nothing meaningful can be suggested.
 */
export function suggestCheaperAlternative(
  allocation: BudgetAllocation
): CheaperSuggestion | null {
  const { currency } = allocation.transport;

  const candidates: CheaperSuggestion[] = [];

  // Suggest bus over train if transport cost is high
  if (allocation.transport.amount > convertFromINR(3000, currency)) {
    candidates.push({
      field: "transport",
      currentCost: allocation.transport,
      suggestedCost: makeAmount(
        convertFromINR(allocation.transport.amount, "INR") * 0.5,
        currency
      ),
      suggestion: "Switch to bus for ~50% transport savings",
    });
  }

  // Suggest hostel over hotel
  if (allocation.accommodation.amount > convertFromINR(2000, currency)) {
    candidates.push({
      field: "accommodation",
      currentCost: allocation.accommodation,
      suggestedCost: makeAmount(
        convertFromINR(allocation.accommodation.amount, "INR") * 0.35,
        currency
      ),
      suggestion: "Switch to a hostel for ~65% accommodation savings",
    });
  }

  if (candidates.length === 0) return null;

  // Return the suggestion with the largest absolute saving
  return candidates.sort(
    (a, b) =>
      b.currentCost.amount - b.suggestedCost.amount - (a.currentCost.amount - a.suggestedCost.amount)
  )[0];
}
