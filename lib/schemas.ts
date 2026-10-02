import { z } from "zod";

// ─── Schema Versioning ────────────────────────────────────────────────────────
// Bump SCHEMA_VERSION when the shape of persisted TripState changes.
// Old localStorage key is abandoned; new key starts clean — no migration needed.

export const SCHEMA_VERSION = 1;
export const TRIP_STORAGE_KEY = `flowroute_trip_v${SCHEMA_VERSION}`;

// ─── Existing Schemas (unchanged) ─────────────────────────────────────────────

export const ExplainabilityMetricSchema = z.object({
  label: z.string(),
  checked: z.boolean(),
  reason: z.string(),
});

export const ItinerarySegmentSchema = z.object({
  time: z.string(),
  activity: z.string(),
  description: z.string(),
  type: z.enum(["travel", "attraction", "food", "rest", "safety"]),
  location: z.string(),
});

export const AiSuggestionSchema = z.object({
  id: z.string(),
  icon: z.string(),
  category: z.enum(["accessibility", "weather", "health", "food", "safety", "time", "eco"]),
  message: z.string(),
  severity: z.enum(["info", "warning", "tip"]),
});

export const DynamicAiPlanSchema = z.object({
  explainability: z.array(ExplainabilityMetricSchema).min(1),
  itinerary: z.array(ItinerarySegmentSchema).min(1),
  aiSuggestions: z.array(AiSuggestionSchema).min(1),
  accessibilityScore: z.number().min(0).max(100),
  safetyScore: z.number().min(0).max(100),
});

export const ParsedQuerySchema = z.object({
  from: z.string(),
  to: z.string(),
  budget: z.number().nullable().optional(),
  travellers: z.number().nullable().optional(),
  preferences: z.array(z.string()),
  safetyMode: z.boolean(),
  // Phase 1 additions (optional — backward compat with existing parse responses)
  returnDate: z.string().optional(),
  accommodation: z.string().optional(),
  travelerType: z.string().optional(),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).optional(),
});

// ─── New Phase 1 Schemas ──────────────────────────────────────────────────────

/** Richer NL parse output — superset of ParsedQuerySchema */
export const TripIntentSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  travellers: z.number().int().min(1).max(20).default(1),
  budget: z.number().positive().optional(),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR"),
  preferences: z.array(z.string()).default([]),
  travelerProfile: z
    .enum(["solo", "couple", "family", "elderly", "accessible"])
    .default("solo"),
  accommodationPreference: z
    .enum(["hotel", "hostel", "apartment", "camping", "flexible"])
    .optional(),
  safetyMode: z.boolean().default(false),
});

/** A single day in a multi-day trip plan */
export const TripDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  date: z.string().optional(),
  segments: z.array(ItinerarySegmentSchema),
  accommodation: z
    .object({
      name: z.string(),
      type: z.string(),
      estimatedCostPerNight: z.number().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

/** Full multi-day trip plan returned by /api/ai/trip */
export const TripPlanSchema = z.object({
  tripId: z.string(),
  from: z.string(),
  to: z.string(),
  days: z.array(TripDaySchema).min(1).max(7),
  budgetBreakdown: z
    .object({
      transport: z.number(),
      accommodation: z.number(),
      food: z.number(),
      activities: z.number(),
      reserve: z.number(),
      currency: z.string(),
    })
    .optional(),
  aiSuggestions: z.array(AiSuggestionSchema).optional(),
  accessibilityScore: z.number().min(0).max(100).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  isDemoData: z.boolean().default(false),
});

/** Shape of trip persisted in localStorage — validated on rehydration */
export const TripStateSchema = z.object({
  id: z.string(),
  intent: TripIntentSchema,
  status: z.enum(["planning", "booked", "active", "completed"]),
  accommodation: z
    .object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      pricePerNight: z.object({ amount: z.number(), currency: z.string() }),
      isDemoData: z.literal(true),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Inferred types for convenience
export type TripIntent = z.infer<typeof TripIntentSchema>;
export type TripDay = z.infer<typeof TripDaySchema>;
export type TripPlan = z.infer<typeof TripPlanSchema>;
export type TripStateStored = z.infer<typeof TripStateSchema>;
