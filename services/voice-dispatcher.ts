/**
 * services/voice-dispatcher.ts
 *
 * Phase 4 — Voice Agentic Action Dispatcher
 *
 * Parses free-form spoken text into structured, typed actions that the app
 * can execute deterministically. No LLM call — pure regex + keyword matching
 * for instant, offline-capable intent resolution.
 *
 * Architecture:
 *   spoken phrase → parseVoiceIntent() → VoiceIntent (typed) → caller executes
 *
 * Supported Intent Categories:
 *   - navigation   → switch app tabs
 *   - budget       → query or simulate budget
 *   - route        → switch optimization mode
 *   - map          → center map, show POI layers
 *   - safety       → enable/disable safety mode, trigger SOS
 *   - settings     → change language, currency, traveler profile
 *   - trip         → start new trip, clear trip
 *   - speak        → speak current state (read-aloud)
 *   - unknown      → could not parse
 */

// ─── Intent Types ─────────────────────────────────────────────────────────────

export type IntentCategory =
  | "navigation"
  | "budget"
  | "route"
  | "map"
  | "safety"
  | "settings"
  | "trip"
  | "speak"
  | "unknown";

export interface NavigationIntent {
  category: "navigation";
  tab: string;            // matches journey page tab id
  tabLabel: string;       // human-readable for TTS feedback
}

export interface BudgetIntent {
  category: "budget";
  action: "show" | "simulate";
  simulatedAmount?: number;  // for "simulate budget of 25000"
  currency?: string;
}

export interface RouteIntent {
  category: "route";
  mode: "fastest" | "cheapest" | "eco" | "comfortable";
}

export interface MapIntent {
  category: "map";
  action: "center_user" | "show_hospitals" | "show_food" | "show_attractions" | "show_essentials";
}

export interface SafetyIntent {
  category: "safety";
  action: "enable" | "disable" | "sos";
}

export interface SettingsIntent {
  category: "settings";
  field: "language" | "currency" | "traveler_profile";
  value: string;
}

export interface TripIntent {
  category: "trip";
  action: "new" | "save" | "clear";
}

export interface SpeakIntent {
  category: "speak";
  subject: "budget" | "status" | "location" | "route" | "next_stop";
}

export interface UnknownIntent {
  category: "unknown";
  rawText: string;
}

export type VoiceIntent =
  | NavigationIntent
  | BudgetIntent
  | RouteIntent
  | MapIntent
  | SafetyIntent
  | SettingsIntent
  | TripIntent
  | SpeakIntent
  | UnknownIntent;

// ─── Text Normalizer ──────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Normalize Hindi / Malayalam numerals to ASCII
    .replace(/[०१२३४५६७८९]/g, (d) => String("०१२३४५६७८९".indexOf(d)))
    .replace(/[൦൧൨൩൪൫൬൭൮൯]/g, (d) => String("൦൧൨൩൪൫൬൭൮൯".indexOf(d)))
    // Strip punctuation
    .replace(/[.,!?;:]/g, " ")
    .replace(/\s+/g, " ");
}



// ─── Tab Keyword Map ──────────────────────────────────────────────────────────

/**
 * Maps spoken keywords to journey page tab IDs.
 * Supports English, Hindi (romanized + devanagari), and Malayalam.
 */
const TAB_KEYWORD_MAP: Array<{
  tab: string;
  label: string;
  keywords: RegExp;
}> = [
  {
    tab: "route",
    label: "Route",
    keywords: /\b(route|routes|navigation|map route|रूट|मार्ग|route plan|റൂട്ട്)\b/,
  },
  {
    tab: "multiday",
    label: "Trip Plan",
    keywords: /\b(trip plan|day plan|multi.?day|yatra yojana|यात्रा योजना|यात्रा प्लान|day by day|full plan|detailed plan|multi day)\b/,
  },

  {
    tab: "budget",
    label: "Budget",
    keywords: /\b(budget|money|cost|expense|spending|खर्च|बजट|ബജറ്റ്|balance|how much)\b/,
  },
  {
    tab: "accommodation",
    label: "Stay",
    keywords: /\b(stay|hotel|hotels|hostel|accommodation|lodge|where to sleep|ठहरना|रहना|room|rooms|ഹോട്ടൽ)\b/,
  },

  {
    tab: "food",
    label: "Food",
    keywords: /\b(food|eat|restaurant|dining|खाना|भोजन|ഭക്ഷണം|nearby food|where to eat)\b/,
  },
  {
    tab: "weather",
    label: "Weather",
    keywords: /\b(weather|rain|temperature|forecast|climate|मौसम|കാലാവസ്ഥ)\b/,
  },
  {
    tab: "essentials",
    label: "Essentials",
    keywords: /\b(hospital|pharmacy|clinic|essentials|medical|doctor|ambulance|police|emergency services|अस्पताल|ആശുപത്രി)\b/,
  },
  {
    tab: "attractions",
    label: "Attractions",
    keywords: /\b(attraction|sight|sightseeing|landmark|tourist|visit|दर्शनीय|ആകർഷണം|places to see|where to go)\b/,
  },
  {
    tab: "booking",
    label: "Tickets",
    keywords: /\b(ticket|book|booking|reserve|टिकट|ടിക്കറ്റ്)\b/,
  },
  {
    tab: "whatif",
    label: "What If",
    keywords: /\b(what if|simulate|simulation|change budget|what would happen|adjust budget|क्या होगा|budget simulator)\b/,
  },
  {
    tab: "carbon",
    label: "Carbon",
    keywords: /\b(carbon|eco|environment|emissions|green|co2|footprint|पर्यावरण|carbon footprint)\b/,
  },
  {
    tab: "ai",
    label: "AI Tips",
    keywords: /\b(ai tips|suggestions|ai advice|smart tips|artificial intelligence|ai|सुझाव|ai)\b/,
  },
  {
    tab: "itinerary",
    label: "Itinerary",
    keywords: /\b(itinerary|steps|timeline|today's plan|what to do|agenda)\b/,
  },
  {
    tab: "whatnext",
    label: "What Next",
    keywords: /\b(what next|next step|next action|what should i do|आगे|अगला|അടുത്തത്)\b/,
  },
];

// ─── Main Intent Parser ───────────────────────────────────────────────────────

/**
 * Parses a spoken transcript into a typed VoiceIntent.
 * Returns UnknownIntent if no pattern matches.
 *
 * Priority order (highest → lowest):
 *   1. Safety / SOS (highest — emergency)
 *   2. Route optimization
 *   3. Map commands
 *   4. Budget simulation (specific amount mentioned)
 *   5. Navigation (tab switch)
 *   6. Settings changes
 *   7. Trip-level actions
 *   8. Read-aloud / speak commands
 *   9. Unknown
 */
export function parseVoiceIntent(rawTranscript: string): VoiceIntent {
  // Extract numbers from raw text BEFORE normalization strips decimal points
  const rawLakhMatch = rawTranscript.match(/(\d+(?:\.\d+)?)\s*lakh/i);
  const rawThousandMatch = rawTranscript.match(/(\d+(?:\.\d+)?)\s*thousand/i);
  const rawPlainMatch = rawTranscript.match(/(\d[\d,]*)/);
  function extractNumberFromRaw(): number | null {
    if (rawLakhMatch) return parseFloat(rawLakhMatch[1]) * 100_000;
    if (rawThousandMatch) return parseFloat(rawThousandMatch[1]) * 1_000;
    if (rawPlainMatch) return parseFloat(rawPlainMatch[1].replace(/,/g, ""));
    return null;
  }

  const t = normalize(rawTranscript);

  // ── 1. Safety / SOS ──────────────────────────────────────────────────────────
  if (/\b(sos|emergency|help me|mayday|danger|i am in danger|call for help|संकट|अत्यावश्यक|rescue|help)\b/.test(t)) {
    return { category: "safety", action: "sos" };
  }
  // Disable BEFORE enable (longer phrase matches first)
  if (/\b(turn off safety|disable safety|safety mode off|normal mode)\b/.test(t)) {
    return { category: "safety", action: "disable" };
  }
  if (/\b(turn on safety|enable safety|safety mode on|safe mode|safety mode)\b/.test(t)) {
    return { category: "safety", action: "enable" };
  }

  // ── 2. Route mode ────────────────────────────────────────────────────────────
  if (/\b(fastest|quick|quickest|सबसे तेज|fast route)\b/.test(t)) {
    return { category: "route", mode: "fastest" };
  }
  if (/\b(cheapest|cheapest route|budget route|cheap|सस्ता|cheap option|low cost)\b/.test(t)) {
    return { category: "route", mode: "cheapest" };
  }
  if (/\b(eco.?friendly|low emission|sustainable route)\b/.test(t)) {
    return { category: "route", mode: "eco" };
  }
  if (/\b(comfortable|comfort|luxury|relaxed|premium|आरामदायक)\b/.test(t)) {
    return { category: "route", mode: "comfortable" };
  }

  // ── 3. Map actions ────────────────────────────────────────────────────────────
  if (/\b(find hospitals?|nearby hospitals?|show hospitals?|nearest hospital|hospitals? near|pharmacy|clinic|ambulance|ആശുപത്രി|अस्पताल)\b/.test(t)) {

    return { category: "map", action: "show_hospitals" };
  }
  if (/\b(center map|show my location|locate me|center on me)\b/.test(t)) {
    return { category: "map", action: "center_user" };
  }
  if (/\b(show food|find restaurants|nearby restaurants|food near me)\b/.test(t)) {
    return { category: "map", action: "show_food" };
  }
  if (/\b(show attractions|tourist spots)\b/.test(t)) {
    return { category: "map", action: "show_attractions" };
  }

  // ── 4. Budget simulation (specific amount) ────────────────────────────────────
  if (/\b(simulate|budget of|change budget|set budget|budget to|what if.*budget|if.*budget)\b/.test(t)) {
    return { category: "budget", action: "simulate", simulatedAmount: extractNumberFromRaw() ?? undefined };
  }

  // ── 5. Settings — BEFORE navigation to prevent "solo" → multiday tab ─────────
  if (/\b(switch to english|english language)\b/.test(t)) {
    return { category: "settings", field: "language", value: "en" };
  }
  if (/\b(switch to hindi|hindi language|hindi|हिंदी)\b/.test(t)) {
    return { category: "settings", field: "language", value: "hi" };
  }
  if (/\b(switch to malayalam|malayalam|മലയാളം)\b/.test(t)) {
    return { category: "settings", field: "language", value: "ml" };
  }
  if (/\b(inr|indian rupee|rupee|rupees)\b/.test(t)) {
    return { category: "settings", field: "currency", value: "INR" };
  }
  if (/\b(usd|dollar|dollars|us dollar)\b/.test(t)) {
    return { category: "settings", field: "currency", value: "USD" };
  }
  if (/\b(eur|euro|euros)\b/.test(t)) {
    return { category: "settings", field: "currency", value: "EUR" };
  }
  if (/\b(gbp|pound|pounds|sterling)\b/.test(t)) {
    return { category: "settings", field: "currency", value: "GBP" };
  }
  if (/\b(solo|travelling alone|traveling alone|alone|single travell)\b/.test(t)) {
    return { category: "settings", field: "traveler_profile", value: "solo" };
  }
  if (/\b(couple|two people|with partner|romantic)\b/.test(t)) {
    return { category: "settings", field: "traveler_profile", value: "couple" };
  }
  if (/\b(family trip|with kids|family travel|travelling with children)\b/.test(t)) {
    return { category: "settings", field: "traveler_profile", value: "family" };
  }

  // ── 6. Trip level actions — BEFORE navigation to prevent "new trip" → multiday tab ──
  if (/\b(new trip|start over|reset trip|plan new|new journey|start a new)\b/.test(t)) {
    return { category: "trip", action: "new" };
  }
  if (/\b(save trip|save journey|save this trip|bookmark trip|save my trip)\b/.test(t)) {
    return { category: "trip", action: "save" };
  }
  if (/\b(clear trip|delete trip|remove trip|erase trip|clear my trip)\b/.test(t)) {
    return { category: "trip", action: "clear" };
  }

  // ── 7. Read-aloud / speak — BEFORE navigation to prevent "budget left" → budget tab ──
  if (/\b(how much.*left|remaining budget|budget left|what.?s my budget|read.*budget|tell.*budget)\b/.test(t)) {
    return { category: "speak", subject: "budget" };
  }
  if (/\b(where am i|current position|where.*i am)\b/.test(t)) {
    return { category: "speak", subject: "location" };
  }
  if (/\b(journey status|trip status|how.*going|am i on track|on track)\b/.test(t)) {
    return { category: "speak", subject: "status" };
  }
  if (/\b(next stop|what.?s next|next destination|where.*going next)\b/.test(t)) {
    return { category: "speak", subject: "next_stop" };
  }
  if (/\b(which route|best route|tell.*route|read.*route)\b/.test(t)) {
    return { category: "speak", subject: "route" };
  }

  // ── 8. Navigation (tab switch) ────────────────────────────────────────────────
  // Only match with an explicit nav-verb prefix OR for unambiguous single-word tab lookups
  const hasNavVerb = /\b(show|open|go to|switch to|take me to|navigate to|display|see)\b/.test(t);
  if (hasNavVerb) {
    for (const { tab, label, keywords } of TAB_KEYWORD_MAP) {
      if (keywords.test(t)) {
        return { category: "navigation", tab, tabLabel: label };
      }
    }
  }

  // ── 9. Final fallback: try tab matching for short direct utterances ────────────
  // e.g. "weather", "food", "budget" — but ONLY if the text is very short (1-2 words)
  const wordCount = t.trim().split(/\s+/).length;
  if (wordCount <= 5) {

    for (const { tab, label, keywords } of TAB_KEYWORD_MAP) {
      if (keywords.test(t)) {
        return { category: "navigation", tab, tabLabel: label };
      }
    }
  }

  return { category: "unknown", rawText: rawTranscript };
}



// ─── TTS Response Templates ────────────────────────────────────────────────────

/**
 * Returns a spoken confirmation string for a successfully dispatched intent.
 * Used for accessibility / ambient mode feedback.
 */
export function getIntentConfirmation(intent: VoiceIntent): string {
  switch (intent.category) {
    case "navigation":
      return `Opening ${intent.tabLabel}.`;
    case "budget":
      if (intent.action === "simulate" && intent.simulatedAmount) {
        return `Simulating a budget of ${intent.simulatedAmount.toLocaleString()} in the What If panel.`;
      }
      return "Showing your budget breakdown.";
    case "route":
      return `Switching to the ${intent.mode} route.`;
    case "map":
      switch (intent.action) {
        case "show_hospitals": return "Showing nearby hospitals and pharmacies on the map.";
        case "center_user": return "Centering map on your current location.";
        case "show_food": return "Showing nearby restaurants on the map.";
        case "show_attractions": return "Showing tourist attractions.";
        default: return "Updating map view.";
      }
    case "safety":
      if (intent.action === "sos") return "Activating emergency mode. Stay calm.";
      if (intent.action === "enable") return "Safety mode enabled. Stay safe.";
      return "Safety mode disabled.";
    case "settings":
      if (intent.field === "language") return `Switching language to ${intent.value === "en" ? "English" : intent.value === "hi" ? "Hindi" : "Malayalam"}.`;
      if (intent.field === "currency") return `Currency set to ${intent.value}.`;
      return `Profile updated to ${intent.value}.`;
    case "trip":
      if (intent.action === "new") return "Starting a new trip. Taking you to the home screen.";
      if (intent.action === "save") return "Saving your current trip.";
      return "Trip cleared.";
    case "speak":
      return ""; // caller fills this in with dynamic data
    case "unknown":
      return `Sorry, I didn't understand "${intent.rawText}". Try saying "show budget" or "switch to eco route".`;
  }
}
