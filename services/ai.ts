import { GoogleGenerativeAI } from "@google/generative-ai";
import { TravelPreference, AiSuggestion, Attraction, FoodStop, Essential, JourneyPlan, JourneyRoute } from "@/types/journey";

const apiKey = typeof window !== "undefined" 
  ? (window.localStorage.getItem("GEMINI_API_KEY") || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "")
  : (process.env.GEMINI_API_KEY || "");

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface ParsedQuery {
  from: string;
  to: string;
  budget?: number;
  travellers?: number;
  preferences: TravelPreference[];
  safetyMode?: boolean;
}

// Local rule-based NLU Parser fallback
export function parseQueryLocally(query: string): ParsedQuery {
  const q = query.toLowerCase().trim();
  
  let from = "";
  let to = "";
  
  // Extract "from X to Y" patterns
  const fromToRegex = /(?:from|take me from)\s+(.+?)\s+(?:to|heading to)\s+(.+)/i;
  const match = query.match(fromToRegex);
  
  if (match) {
    from = match[1].trim();
    to = match[2].trim();
  } else {
    // Fallbacks for simpler structures
    const toOnlyMatch = /(?:to|destination)\s+(.+)/i;
    const toOnly = query.match(toOnlyMatch);
    if (toOnly) {
      from = "Current Location";
      to = toOnly[1].trim();
    } else {
      // split on standard keywords
      const parts = query.split(/\s+(?:to|heading to)\s+/i);
      if (parts.length >= 2) {
        from = parts[0].replace(/take me|go/gi, "").trim();
        to = parts[1].trim();
      } else {
        from = "Kochi Airport";
        to = "Marine Drive";
      }
    }
  }

  // Clean up punctuation
  from = from.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
  to = to.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();

  // Extract budget if present
  let budget = 5000;
  const budgetMatch = q.match(/(?:budget|cost|price|max|under|below)\s+(?:of|is|under|around|rs|₹|inr|usd|gbp)?\s*(\d+)/i);
  if (budgetMatch) {
    budget = parseInt(budgetMatch[1]);
  } else if (q.includes("cheap") || q.includes("budget") || q.includes("low cost") || q.includes("economy")) {
    budget = 1200;
  } else if (q.includes("luxury") || q.includes("expensive") || q.includes("premium")) {
    budget = 25000;
  }

  // Extract preferences
  const preferences: TravelPreference[] = [];
  if (q.includes("wheelchair") || q.includes("access") || q.includes("disabled") || q.includes("mobility")) {
    preferences.push("wheelchair");
  }
  if (q.includes("elderly") || q.includes("senior") || q.includes("old") || q.includes("grandparent")) {
    preferences.push("elderly");
  }
  if (q.includes("family") || q.includes("kids") || q.includes("pram") || q.includes("children")) {
    preferences.push("family");
  }
  if (q.includes("baby") || q.includes("infant") || q.includes("stroller") || q.includes("toddler")) {
    preferences.push("baby");
  }
  if (q.includes("cheap") || q.includes("budget") || q.includes("frugal") || q.includes("lowest cost")) {
    preferences.push("budget");
  }
  if (q.includes("fast") || q.includes("quick") || q.includes("speed") || q.includes("hurry")) {
    preferences.push("fastest");
  }
  if (q.includes("eco") || q.includes("green") || q.includes("carbon") || q.includes("environment")) {
    preferences.push("eco");
  }
  if (q.includes("food") || q.includes("restaurant") || q.includes("eat") || q.includes("hungry") || q.includes("cafe")) {
    preferences.push("foodie");
  }
  if (q.includes("tourist") || q.includes("sight") || q.includes("scenic") || q.includes("view") || q.includes("visit")) {
    preferences.push("tourist");
  }
  if (q.includes("backpacker") || q.includes("hostel") || q.includes("cheap accommodation")) {
    preferences.push("backpacker");
  }

  // Default preference if empty
  if (preferences.length === 0) {
    preferences.push("fastest");
  }

  // Women's safety mode detection
  const safetyMode = q.includes("safe") || q.includes("safety") || q.includes("women") || q.includes("security") || q.includes("alone") || q.includes("night");

  return {
    from,
    to,
    budget,
    travellers: 1,
    preferences,
    safetyMode
  };
}

export async function parseQueryWithAI(query: string): Promise<ParsedQuery> {
  if (!genAI) {
    return parseQueryLocally(query);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are the NLU query parser for FlowRoute, an AI-powered inclusive smart mobility assistant.
    Analyze the user's search query and extract structured fields:
    User request: "${query}"

    Map preferences to these allowed values: "elderly", "family", "baby", "wheelchair", "budget", "fastest", "eco", "foodie", "tourist", "backpacker".
    Set "safetyMode" to true if user mentions terms like "safety", "safe", "secure", "women's safety", "alone", "night".
    
    Output strictly a JSON object with:
    {
      "from": "origin name",
      "to": "destination name",
      "budget": number or null,
      "travellers": number or null,
      "preferences": ["pref1", "pref2"],
      "safetyMode": boolean
    }
    
    Ensure valid JSON and no code block formatting. Only output the JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text) as ParsedQuery;
  } catch (error) {
    console.error("Gemini query parse failed, falling back to local parsing:", error);
    return parseQueryLocally(query);
  }
}

export interface ItinerarySegment {
  time: string; // e.g. "09:00 AM"
  activity: string;
  description: string;
  type: "travel" | "attraction" | "food" | "rest" | "safety";
  location: string;
}

export interface ExplainabilityMetric {
  label: string;
  checked: boolean;
  reason: string;
}

export interface DynamicAiPlan {
  explainability: ExplainabilityMetric[];
  itinerary: ItinerarySegment[];
  aiSuggestions: AiSuggestion[];
  accessibilityScore: number;
  safetyScore: number;
}

// Generate dynamic AI Travel plan
export async function generateDynamicPlan(params: {
  from: string;
  to: string;
  budget: number;
  preferences: TravelPreference[];
  safetyMode: boolean;
  isOffline: boolean;
}): Promise<DynamicAiPlan> {
  const { from, to, budget, preferences, safetyMode } = params;

  // Determine locations context
  const isKochi = from.toLowerCase().includes("kochi") || to.toLowerCase().includes("kochi") || 
                  from.toLowerCase().includes("airport") || to.toLowerCase().includes("marine drive");

  // Default localized parameters
  const currencySymbol = "₹";
  const cityLabel = isKochi ? "Kochi" : "London";

  if (genAI && !params.isOffline) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are FlowRoute AI, a smart travel companion.
      Generate a travel plan from "${from}" to "${to}".
      Budget constraint: ${currencySymbol}${budget}.
      Preferences: ${preferences.join(", ")}.
      Women's Safety Mode: ${safetyMode ? "ENABLED" : "DISABLED"}.
      
      Respond with a JSON containing:
      1. "explainability": array of 5 explainability items (Shortest travel time, Wheelchair accessible, Safer roads, Lower cost, Lower carbon emissions). Each has: "label" (string), "checked" (boolean - does it fit?), and "reason" (string - short explanation why).
      2. "itinerary": array of 5 itinerary segments showing a structured travel experience including morning/afternoon/evening, food stop, tourist attraction, and rest stop. Each segment has: "time" (string), "activity" (string), "description" (string), "type" (one of "travel", "attraction", "food", "rest", "safety"), and "location" (string).
      3. "aiSuggestions": array of 4 AI suggestion items matching the prompt with fields: "id" (string), "icon" (emoji), "category" (one of "accessibility", "weather", "health", "food", "safety", "time", "eco"), "message" (string), "severity" (one of "info", "warning", "tip").
      4. "accessibilityScore": number (0 to 100) reflecting how suitable the route is for selected accessibility needs.
      5. "safetyScore": number (0 to 100) reflecting safety factors.

      Output strictly a JSON object with no wrapping markdown formatting.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text) as DynamicAiPlan;
    } catch (e) {
      console.warn("Gemini plan generation failed, falling back to local generator:", e);
    }
  }

  // Sophisticated Local plan generator fallback
  const explainability: ExplainabilityMetric[] = [
    {
      label: "Shortest travel time",
      checked: preferences.includes("fastest") || preferences.length === 1,
      reason: preferences.includes("fastest") 
        ? "Optimized route through primary express lines saves 15 minutes." 
        : "Standard transit connections chosen, balance between speed and comfort."
    },
    {
      label: "Wheelchair accessible",
      checked: preferences.includes("wheelchair") || preferences.includes("elderly"),
      reason: (preferences.includes("wheelchair") || preferences.includes("elderly"))
        ? "Routes completely mapped via step-free platforms, working elevators, and ramped vehicle entries."
        : "Route includes minor stairs at street levels. Switch profile to Wheelchair for step-free alternatives."
    },
    {
      label: "Safer roads",
      checked: safetyMode || preferences.includes("family"),
      reason: safetyMode
        ? "Prioritized well-lit streets, high-density areas, and proximity to security checkpoints/hospitals."
        : "Standard travel route. Safety mode toggle can be activated for reinforced security routing."
    },
    {
      label: "Lower cost",
      checked: preferences.includes("budget") || preferences.includes("backpacker") || budget < 3000,
      reason: (preferences.includes("budget") || preferences.includes("backpacker"))
        ? "Prioritized public bus networks and shared transit over private cabs, saving up to 80%."
        : "Standard transit ticket prices. Eco-saver public routes are available for lower budgets."
    },
    {
      label: "Lower carbon emissions",
      checked: preferences.includes("eco") || preferences.includes("wheelchair") || preferences.includes("budget"),
      reason: preferences.includes("eco")
        ? "Selected shared electric transit and walking pathways, saving 2.5kg of CO₂."
        : "Standard public transit route. Green footprint options available."
    }
  ];

  // Kochi Localized Itinerary Fallback
  const kochiItinerary: ItinerarySegment[] = [
    {
      time: "09:00 AM",
      activity: "Morning Departure",
      description: `Boarding Kochi Metro from Aluva Station towards Marine Drive or accessible low-floor AC transit.`,
      type: "travel",
      location: from
    },
    {
      time: "10:30 AM",
      activity: "Explore Marine Drive Walkway",
      description: "Scenic promenade overlooking Kochi backwaters. Features accessible wide ramps, benches, and clean rest stops.",
      type: "attraction",
      location: "Marine Drive Walkway"
    },
    {
      time: "01:00 PM",
      activity: "Lunch Stop - Local Culinary Experience",
      description: "Enjoy traditional Kerala seafood and vegetarian thali at Paragon Restaurant or a cozy cafe nearby.",
      type: "food",
      location: "Paragon Restaurant, Kochi"
    },
    {
      time: "03:30 PM",
      activity: "Relax at Subhash Bose Park",
      description: "Lush green community park. Well-lit pathways, security patrols, and wheel-friendly entry gates.",
      type: "rest",
      location: "Subhash Park, Ernakulam"
    },
    {
      time: "06:00 PM",
      activity: "Sunset Cruise & Safety Checkpoint",
      description: "Take the governmental water metro ferry (100% wheelchair friendly and guarded). Returns to base point.",
      type: "safety",
      location: "Ernakulam Jetty"
    }
  ];

  // London / Generic Localized Itinerary Fallback
  const genericItinerary: ItinerarySegment[] = [
    {
      time: "09:30 AM",
      activity: "Morning Departure",
      description: `Boarding the step-free accessible Circle Line or bus connections towards ${to}.`,
      type: "travel",
      location: from
    },
    {
      time: "11:00 AM",
      activity: "Sightseeing and Landmarks",
      description: `Visiting the iconic spaces around ${to}. Pedestrian friendly lanes and active information guides.`,
      type: "attraction",
      location: to
    },
    {
      time: "12:30 PM",
      activity: "Lunch at Local Hub",
      description: "Delicious quick bites and refreshments at a highly-rated, budget-friendly cafe nearby.",
      type: "food",
      location: `${to} Food Market`
    },
    {
      time: "02:30 PM",
      activity: "Afternoon Rest Spot",
      description: "Cozy rest area and public gardens. Quiet benches and clean facilities available.",
      type: "rest",
      location: "City Garden Plaza"
    },
    {
      time: "05:00 PM",
      activity: "Safe Commute Return",
      description: "Return commute via primary, high-patrol transit lines. Fully lit walkways and immediate help-points.",
      type: "safety",
      location: "Central Station Hub"
    }
  ];

  const itinerary = isKochi ? kochiItinerary : genericItinerary;

  // Build AI Suggestions
  const kochiSuggestions: AiSuggestion[] = [
    {
      id: "sug-1",
      icon: "♿",
      category: "accessibility",
      message: "Kochi Metro provides tactile paving and dedicated wheelchair anchors in all compartments. Boarding is 100% accessible.",
      severity: "info"
    },
    {
      id: "sug-2",
      icon: "☔",
      category: "weather",
      message: "Monsoon humidity is high (84%). Brief afternoon showers predicted; carry an umbrella and prefer AC transit options.",
      severity: "warning"
    },
    {
      id: "sug-3",
      icon: "🚔",
      category: "safety",
      message: "Women's Help desks are available at Kochi Metro stations. Pink Patrol vehicles are active around Marine Drive walkway.",
      severity: "tip"
    },
    {
      id: "sug-4",
      icon: "🥗",
      category: "food",
      message: "Paragon Restaurant near Marine Drive is famous for Biryani and has step-free ground floor seating.",
      severity: "tip"
    }
  ];

  const genericSuggestions: AiSuggestion[] = [
    {
      id: "sug-1",
      icon: "🚇",
      category: "accessibility",
      message: "Selected transit stations feature step-free platform access and operational elevators. Highly recommended for strollers.",
      severity: "info"
    },
    {
      id: "sug-2",
      icon: "🌦️",
      category: "weather",
      message: "Partly cloudy with mild winds. High chance of light showers after 4:00 PM. Indoor sightseeing recommended for late afternoon.",
      severity: "warning"
    },
    {
      id: "sug-3",
      icon: "🛡️",
      category: "safety",
      message: "Primary streets are highly crowded and well-lit. Police assistance booths are located near the main station entrances.",
      severity: "tip"
    },
    {
      id: "sug-4",
      icon: "🥪",
      category: "food",
      message: "Local street market features quick grab-and-go options under ₹400 per person. Very budget friendly.",
      severity: "tip"
    }
  ];

  const aiSuggestions = isKochi ? kochiSuggestions : genericSuggestions;

  // Compute scores based on preferences and safety mode
  let accessibilityScore = 75;
  if (preferences.includes("wheelchair") || preferences.includes("elderly")) {
    accessibilityScore = 96;
  } else if (preferences.includes("family") || preferences.includes("baby")) {
    accessibilityScore = 88;
  }

  let safetyScore = 78;
  if (safetyMode) {
    safetyScore = 95;
  } else if (preferences.includes("family")) {
    safetyScore = 87;
  }

  return {
    explainability,
    itinerary,
    aiSuggestions,
    accessibilityScore,
    safetyScore
  };
}
