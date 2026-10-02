import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { TripPlanSchema, TripIntentSchema } from "@/lib/schemas";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// In-memory rate limiter (per IP, 1 request per 5 seconds for multi-day)
const rateLimiter = new Map<string, number>();

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
    }
  }
  throw new Error("Max retries exceeded");
}

export async function POST(req: NextRequest) {
  // Rate limiting — stricter than single-route (5s gap for multi-day)
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const lastCall = rateLimiter.get(ip) ?? 0;
  if (Date.now() - lastCall < 5000) {
    return NextResponse.json({ error: "Rate limited. Please wait." }, { status: 429 });
  }
  rateLimiter.set(ip, Date.now());

  try {
    const body = await req.json();

    // ── Server-enforced values (never from AI) ────────────────────────────────
    // Parse and validate the intent — budget, travellers, currency are
    // taken from the parsed intent; the AI only generates prose.
    const intentParsed = TripIntentSchema.safeParse(body.intent);
    if (!intentParsed.success) {
      return NextResponse.json(
        { error: "Invalid trip intent", details: intentParsed.error.flatten() },
        { status: 400 }
      );
    }

    const intent = intentParsed.data;

    // Prompt injection protection — sanitize all user-supplied strings
    const safeFrom = String(intent.from).replace(/[`"\\<>]/g, "").substring(0, 200);
    const safeTo   = String(intent.to).replace(/[`"\\<>]/g, "").substring(0, 200);
    const safePrefs = (intent.preferences ?? [])
      .map((p) => String(p).replace(/[`"\\]/g, "").substring(0, 50))
      .slice(0, 10)
      .join(", ");

    // Server-enforced constraints (AI cannot override these)
    const maxDays    = Math.min(7, intent.returnDate
      ? Math.ceil((new Date(intent.returnDate).getTime() - new Date(intent.departureDate ?? Date.now()).getTime()) / 86400000) + 1
      : 3);
    const travellers = Math.min(20, Math.max(1, intent.travellers));
    const currency   = intent.currency; // validated enum above

    const safeLanguage = [body.language].includes("hi") ? "Hindi (हिन्दी)" :
                         [body.language].includes("ml") ? "Malayalam (മലയാളം)" : "English";

    if (!genAI) {
      // Rule-based fallback when API key not configured
      return NextResponse.json(buildFallbackPlan(intent, maxDays), { status: 200 });
    }

    const prompt = `You are FlowRoute AI, an expert travel planner.
Create a detailed ${maxDays}-day trip plan from "${safeFrom}" to "${safeTo}".
Travellers: ${travellers}. Currency: ${currency}.
Preferences: ${safePrefs || "balanced"}.
Traveler type: ${intent.travelerProfile}.
Safety mode: ${intent.safetyMode ? "ENABLED" : "DISABLED"}.

CRITICAL RULES:
1. Write all user-facing text in ${safeLanguage}. Keep JSON keys in English.
2. Do NOT include any numbers, prices, or costs — these are server-calculated.
3. Maximum ${maxDays} days, no more.
4. Each day must have 2–5 itinerary segments.

Respond with a strict JSON matching this structure (no markdown wrappers):
{
  "tripId": "auto",
  "from": "${safeFrom}",
  "to": "${safeTo}",
  "days": [
    {
      "dayNumber": 1,
      "segments": [
        {
          "time": "HH:MM",
          "activity": "Activity name",
          "description": "Detailed description in ${safeLanguage}",
          "type": "travel|attraction|food|rest|safety",
          "location": "Location name"
        }
      ],
      "accommodation": {
        "name": "Hotel/hostel name",
        "type": "hotel|hostel|apartment"
      },
      "notes": "Optional day notes in ${safeLanguage}"
    }
  ],
  "aiSuggestions": [
    {
      "id": "unique-id",
      "icon": "emoji",
      "category": "weather|health|food|safety|time|eco|accessibility",
      "message": "Suggestion text in ${safeLanguage}",
      "severity": "info|warning|tip"
    }
  ],
  "accessibilityScore": 75,
  "safetyScore": 80,
  "isDemoData": false
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const result = await callWithRetry(() => model.generateContent(prompt));
      clearTimeout(timeout);
      const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      const raw = JSON.parse(text);
      raw.tripId = `trip-${Date.now()}`;

      const parsed = TripPlanSchema.safeParse(raw);
      if (!parsed.success) {
        console.warn("[ai/trip] Zod validation failed — falling back:", parsed.error.flatten());
        return NextResponse.json(buildFallbackPlan(intent, maxDays));
      }

      return NextResponse.json(parsed.data);
    } catch (e) {
      clearTimeout(timeout);
      console.warn("[ai/trip] AI generation failed — falling back:", e);
      return NextResponse.json(buildFallbackPlan(intent, maxDays));
    }
  } catch (e) {
    console.error("[ai/trip] Unexpected error:", e);
    return NextResponse.json({ error: "Trip generation failed", fallback: true }, { status: 500 });
  }
}

/** Rule-based fallback plan used when AI is unavailable or times out. */
function buildFallbackPlan(intent: ReturnType<typeof TripIntentSchema.parse>, days: number) {
  const dayPlans = Array.from({ length: days }, (_, i) => ({
    dayNumber: i + 1,
    segments: [
      {
        time: "09:00",
        activity: i === 0 ? `Arrive in ${intent.to}` : `Explore ${intent.to} — Day ${i + 1}`,
        description: i === 0
          ? `Travel from ${intent.from} to ${intent.to} and check in.`
          : `Continue exploring the highlights of ${intent.to}.`,
        type: i === 0 ? "travel" : "attraction",
        location: intent.to,
      },
      {
        time: "13:00",
        activity: "Lunch at local restaurant",
        description: "Try local cuisine and refresh.",
        type: "food",
        location: intent.to,
      },
      {
        time: "18:00",
        activity: i === days - 1 ? `Depart for ${intent.from}` : "Evening at leisure",
        description: i === days - 1
          ? `Begin return journey to ${intent.from}.`
          : "Relax, shop, or explore the local market.",
        type: i === days - 1 ? "travel" : "rest",
        location: i === days - 1 ? intent.from : intent.to,
      },
    ],
  }));

  return {
    tripId: `trip-fallback-${Date.now()}`,
    from: intent.from,
    to: intent.to,
    days: dayPlans,
    isDemoData: true,
    aiSuggestions: [
      {
        id: "fallback-tip",
        icon: "ℹ️",
        category: "info",
        message: "This is a basic itinerary. Add a Gemini API key for a personalised plan.",
        severity: "info",
      },
    ],
  };
}
