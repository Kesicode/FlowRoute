import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { DynamicAiPlanSchema } from "@/lib/schemas";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Simple in-memory rate limiter (per IP, 1 request per 3 seconds)
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
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const lastCall = rateLimiter.get(ip) ?? 0;
  if (Date.now() - lastCall < 3000) {
    return NextResponse.json({ error: "Rate limited. Please wait." }, { status: 429 });
  }
  rateLimiter.set(ip, Date.now());

  if (!genAI) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { from, to, budget, preferences, safetyMode, language } = body;

    // Sanitize inputs
    const safefrom = String(from ?? "").replace(/[`"\\]/g, "").substring(0, 200);
    const safeTo = String(to ?? "").replace(/[`"\\]/g, "").substring(0, 200);
    const safeLanguage = ["en", "hi", "ml"].includes(language) ? language : "en";
    const targetLangName =
      safeLanguage === "hi" ? "Hindi (हिन्दी)" : safeLanguage === "ml" ? "Malayalam (മലയാളം)" : "English";
    const currencySymbol = "₹";

    const prompt = `You are FlowRoute AI, a smart travel companion.
Generate a travel plan from "${safefrom}" to "${safeTo}".
Budget constraint: ${currencySymbol}${Number(budget) || 5000}.
Preferences: ${Array.isArray(preferences) ? preferences.join(", ") : "fastest"}.
Women's Safety Mode: ${safetyMode ? "ENABLED" : "DISABLED"}.

CRITICAL: Write all user-facing text values (reasons, activities, descriptions, messages) in ${targetLangName}. Keep JSON keys strictly in English.

Respond with a JSON containing:
1. "explainability": array of 5 items. Each has: "label" (string), "checked" (boolean), "reason" (string).
2. "itinerary": array of 5 segments. Each has: "time" (string), "activity" (string), "description" (string), "type" (one of "travel", "attraction", "food", "rest", "safety"), "location" (string).
3. "aiSuggestions": array of 4 items. Each has: "id" (string), "icon" (emoji), "category" (one of "accessibility", "weather", "health", "food", "safety", "time", "eco"), "message" (string), "severity" (one of "info", "warning", "tip").
4. "accessibilityScore": number (0–100).
5. "safetyScore": number (0–100).

Output strictly a JSON object with no wrapping markdown.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await callWithRetry(() => model.generateContent(prompt));
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = DynamicAiPlanSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.error("AI plan validation failed:", parsed.error);
      return NextResponse.json({ error: "AI response validation failed", fallback: true }, { status: 422 });
    }

    return NextResponse.json(parsed.data);
  } catch (e) {
    console.error("AI plan route error:", e);
    return NextResponse.json({ error: "AI plan generation failed", fallback: true }, { status: 500 });
  }
}
