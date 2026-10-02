// ─── Trip Types ────────────────────────────────────────────────────────────────
// New canonical types for FlowRoute Phase 1.
// These extend the existing types in journey.ts and planner.ts WITHOUT renaming
// anything — all existing imports across the codebase continue to work.

// ─── Traveler Profile ─────────────────────────────────────────────────────────

export type TravelerProfile =
  | "solo"
  | "couple"
  | "family"
  | "elderly"
  | "accessible";

// ─── Trip Status ──────────────────────────────────────────────────────────────

export type TripStatus =
  | "planning"
  | "booked"
  | "active"
  | "completed";

// ─── Discovery Mode ──────────────────────────────────────────────────────────

/** Controls how aggressively the Explore page surfaces nearby POIs. */
export type DiscoveryMode =
  | "off"        // 0 m   – no POI queries
  | "low"        // 500 m – minimal
  | "balanced"   // 1500 m – default
  | "active"     // 3000 m – frequent suggestions along route
  | "adventure"; // 8000 m – maximise serendipity

// ─── Journey Health ──────────────────────────────────────────────────────────

export type JourneyHealth =
  | "on_track"
  | "at_risk"
  | "delayed"
  | "action_required"
  | "completed";

// ─── Budget ───────────────────────────────────────────────────────────────────

export type BudgetRisk = "safe" | "warning" | "over";

/** All monetary values are currency-qualified — never bare numbers. */
export interface MonetaryAmount {
  amount: number;
  currency: string; // ISO 4217 e.g. "INR", "USD"
}

export interface BudgetAllocation {
  transport: MonetaryAmount;
  accommodation: MonetaryAmount;
  food: MonetaryAmount;
  activities: MonetaryAmount;
  reserve: MonetaryAmount;
  /** Total committed spend so far */
  committed?: MonetaryAmount;
  /** Remaining vs original budget */
  remaining?: MonetaryAmount;
  /** Whether these figures are demo/estimated (always true until real providers) */
  isDemoEstimate: true;
}

// ─── Accommodation ────────────────────────────────────────────────────────────

export type AccommodationPreference =
  | "hotel"
  | "hostel"
  | "apartment"
  | "camping"
  | "flexible";

export interface AccommodationOption {
  id: string;
  name: string;
  type: AccommodationPreference;
  pricePerNight: MonetaryAmount;
  rating?: number; // 1-5
  address?: string;
  checkIn?: string; // ISO date string
  checkOut?: string;
  isDemoData: true; // mandatory until real provider
}

// ─── Segment Dependency ───────────────────────────────────────────────────────

/** Captures a hard dependency between two journey segments (e.g. must catch a train). */
export interface SegmentDependency {
  segmentId: string;
  dependsOnSegmentId: string;
  type: "catch" | "connect" | "checkin" | "checkout";
  /** Minimum buffer time in minutes required between the two segments */
  minBufferMinutes: number;
}

// ─── Trip Intent (from NL parse) ─────────────────────────────────────────────

/** The structured output of parsing a natural-language trip request. */
export interface TripIntent {
  from: string;
  to: string;
  departureDate?: string;    // ISO date e.g. "2025-12-01"
  returnDate?: string;
  travellers: number;
  budget?: number;
  currency: "INR" | "USD" | "EUR" | "GBP";
  preferences: string[];
  travelerProfile: TravelerProfile;
  accommodationPreference?: AccommodationPreference;
  safetyMode?: boolean;
}

// ─── Trip State (canonical in-store model) ────────────────────────────────────

export interface TripState {
  id: string;
  intent: TripIntent;
  status: TripStatus;
  /** Accommodation option chosen (if any) */
  accommodation?: AccommodationOption;
  createdAt: string; // ISO timestamp
  updatedAt: string;
}

// ─── Optimization Mode (for route scoring) ────────────────────────────────────

export type OptimizationMode =
  | "fastest"
  | "cheapest"
  | "eco"
  | "comfortable"
  | "scenic"
  | "accessible";

// ─── Loading Phase (for home screen skeleton UI) ─────────────────────────────

export type LoadingPhase =
  | "parsing"
  | "routing"
  | "planning"
  | "optimizing"
  | "done";
