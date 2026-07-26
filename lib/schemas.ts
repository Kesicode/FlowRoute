import { z } from "zod";

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
});
