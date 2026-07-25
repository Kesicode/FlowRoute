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

// ─── Local fallback translations dictionary ───────────────────────────────────
const localTranslations: Record<string, Record<string, string>> = {
  hi: {
    "Shortest travel time": "सबसे कम यात्रा समय",
    "Wheelchair accessible": "व्हीलचेयर सुलभ",
    "Safer roads": "सुरक्षित मार्ग",
    "Lower cost": "कम लागत",
    "Lower carbon emissions": "कम कार्बन उत्सर्जन",
    "Optimized route through primary express lines saves 15 minutes.": "मुख्य एक्सप्रेस लाइनों के माध्यम से अनुकूलित मार्ग 15 मिनट बचाता है।",
    "Standard transit connections chosen, balance between speed and comfort.": "मानक पारगमन कनेक्शन चुने गए, गति और आराम के बीच संतुलन।",
    "Routes completely mapped via step-free platforms, working elevators, and ramped vehicle entries.": "सीढ़ी-रहित प्लेटफॉर्म, चालू लिफ्ट और रैंप वाले वाहन प्रवेश द्वारों के माध्यम से मार्ग पूरी तरह से मैप किए गए हैं।",
    "Route includes minor stairs at street levels. Switch profile to Wheelchair for step-free alternatives.": "मार्ग में सड़क स्तर पर छोटी सीढ़ियां शामिल हैं। सीढ़ी-रहित विकल्पों के लिए व्हीलचेयर प्रोफ़ाइल चुनें।",
    "Prioritized well-lit streets, high-density areas, and proximity to security checkpoints/hospitals.": "अच्छी तरह से रोशनी वाली सड़कों, उच्च घनत्व वाले क्षेत्रों और सुरक्षा चौकियों/अस्पतालों से निकटता को प्राथमिकता दी गई।",
    "Standard travel route. Safety mode toggle can be activated for reinforced security routing.": "सामान्य यात्रा मार्ग। सुरक्षा व्यवस्था बढ़ाने के लिए सुरक्षा मोड चालू किया जा सकता है।",
    "Prioritized public bus networks and shared transit over private cabs, saving up to 80%.": "निजी कैब के स्थान पर सार्वजनिक बस नेटवर्क और साझा पारगमन को प्राथमिकता दी गई, जिससे 80% तक की बचत हुई।",
    "Standard transit ticket prices. Eco-saver public routes are available for lower budgets.": "मानक पारगमन टिकट की कीमतें। कम बजट के लिए इको-सेवर सार्वजनिक मार्ग उपलब्ध हैं।",
    "Selected shared electric transit and walking pathways, saving 2.5kg of CO₂.": "साझा इलेक्ट्रिक पारगमन और पैदल चलने के रास्तों का चयन किया गया, जिससे 2.5 किलोग्राम CO₂ की बचत हुई।",
    "Standard public transit route. Green footprint options available.": "मानक सार्वजनिक पारगमन मार्ग। हरित फुटप्रिंट विकल्प उपलब्ध हैं।",
    "Morning Departure": "सुबह प्रस्थान",
    "Boarding Kochi Metro from Aluva Station towards Marine Drive or accessible low-floor AC transit.": "अलुवा स्टेशन से मरीन ड्राइव या सुलभ लो-फ्लोर एसी पारगमन के लिए कोच्चि मेट्रो में सवार होना।",
    "Explore Marine Drive Walkway": "मरीन ड्राइव वॉकवे का अन्वेषण करें",
    "Scenic promenade overlooking Kochi backwaters. Features accessible wide ramps, benches, and clean rest stops.": "कोच्चि बैकवाटर की ओर देखने वाला सुंदर सैरगाह। इसमें सुलभ चौड़े रैंप, बेंच और साफ विश्राम स्थल हैं।",
    "Lunch Stop - Local Culinary Experience": "लंच स्टॉप - स्थानीय पाक अनुभव",
    "Enjoy traditional Kerala seafood and vegetarian thali at Paragon Restaurant or a cozy cafe nearby.": "पैरागॉन रेस्तरां या पास के आरामदायक कैफे में पारंपरिक केरल सीफूड और शाकाहारी थाली का आनंद लें।",
    "Relax at Subhash Bose Park": "सुभाष चंद्र बोस पार्क में आराम करें",
    "Lush green community park. Well-lit pathways, security patrols, and wheel-friendly entry gates.": "हरा-भरा सामुदायिक पार्क। अच्छी रोशनी वाले मार्ग, सुरक्षा गश्त, और पहिया-अनुकूल प्रवेश द्वार।",
    "Sunset Cruise & Safety Checkpoint": "सूर्यास्त क्रूज और सुरक्षा चौकी",
    "Take the governmental water metro ferry (100% wheelchair friendly and guarded). Returns to base point.": "सरकारी वॉटर मेट्रो नौका लें (100% व्हीलचेयर अनुकूल और सुरक्षित)। बेस पॉइंट पर वापस लौटता है।",
    "Delicious quick bites and refreshments at a highly-rated, budget-friendly cafe nearby.": "पास के एक उच्च श्रेणी वाले, बजट-अनुकूल कैफे में स्वादिष्ट त्वरित भोजन और जलपान।",
    "Afternoon Rest Spot": "दोपहर का विश्राम स्थल",
    "Cozy rest area and public gardens. Quiet benches and clean facilities available.": "आरामदायक विश्राम क्षेत्र और सार्वजनिक उद्यान। शांत बेंच और स्वच्छ सुविधाएं उपलब्ध हैं।",
    "Return commute via primary, high-patrol transit lines. Fully lit walkways and immediate help-points.": "मुख्य, उच्च-गश्ती पारगमन लाइनों के माध्यम से वापसी यात्रा। पूरी तरह से रोशनी वाले मार्ग और तत्काल सहायता केंद्र।",
    "Safe Commute Return": "सुरक्षित वापसी कम्यूट",
    "Kochi Metro provides tactile paving and dedicated wheelchair anchors in all compartments. Boarding is 100% accessible.": "कोच्चि मेट्रो सभी डिब्बों में स्पर्शनीय फ़र्श और समर्पित व्हीलचेयर एंकर प्रदान करती है। बोर्डिंग 100% सुलभ है।",
    "Monsoon humidity is high (84%). Brief afternoon showers predicted; carry an umbrella and prefer AC transit options.": "मानसून की नमी अधिक (84%) है। दोपहर में हल्की बौछारें पड़ने का अनुमान है; छाता साथ रखें और एसी पारगमन को प्राथमिकता दें।",
    "Women's Help desks are available at Kochi Metro stations. Pink Patrol vehicles are active around Marine Drive walkway.": "कोच्चि मेट्रो स्टेशनों पर महिला सहायता डेस्क उपलब्ध हैं। मरीन ड्राइव वॉकवे के आसपास पिंक पेट्रोल वाहन सक्रिय हैं।",
    "Paragon Restaurant near Marine Drive is famous for Biryani and has step-free ground floor seating.": "मरीन ड्राइव के पास पैरागॉन रेस्तरां बिरयानी के लिए प्रसिद्ध है और इसमें सीढ़ी-रहित भूतल बैठने की व्यवस्था है।",
    "Selected transit stations feature step-free platform access and operational elevators. Highly recommended for strollers.": "चयनित पारगमन स्टेशनों में सीढ़ी-रहित प्लेटफॉर्म पहुंच और लिफ्ट की सुविधा है। स्ट्रोलर के लिए अत्यधिक अनुशंसित।",
    "Partly cloudy with mild winds. High chance of light showers after 4:00 PM. Indoor sightseeing recommended for late afternoon.": "हल्की हवाओं के साथ आंशिक रूप से बादल छाए रहेंगे। दोपहर 4:00 बजे के बाद हल्की बौछारें पड़ने की अधिक संभावना है। देर दोपहर में इनडोर दर्शनीय स्थलों की यात्रा की सिफारिश की जाती है।",
    "Primary streets are highly crowded and well-lit. Police assistance booths are located near the main station entrances.": "मुख्य सड़कें अत्यधिक भीड़भाड़ वाली और अच्छी रोशनी वाली हैं। मुख्य स्टेशन के प्रवेश द्वारों के पास पुलिस सहायता बूथ स्थित हैं।",
    "Local street market features quick grab-and-go options under ₹400 per person. Very budget friendly.": "स्थानीय स्ट्रीट मार्केट में ₹400 प्रति व्यक्ति से कम में त्वरित भोजन के विकल्प उपलब्ध हैं। काफी बजट-अनुकूल।"
  },
  ml: {
    "Shortest travel time": "ഏറ്റവും കുറഞ്ഞ യാത്രാ സമയം",
    "Wheelchair accessible": "വീൽചെയർ പ്രവേശനക്ഷമത",
    "Safer roads": "സുരക്ഷിതമായ പാതകൾ",
    "Lower cost": "കുറഞ്ഞ ചിലവ്",
    "Lower carbon emissions": "കുറഞ്ഞ കാർബൺ പുറന്തള്ളൽ",
    "Optimized route through primary express lines saves 15 minutes.": "പ്രധാന എക്സ്പ്രസ് ലൈനുകൾ വഴിയുള്ള ഒപ്റ്റിമൈസ് ചെയ്ത റൂട്ട് 15 മിനിറ്റ് ലാഭിക്കുന്നു.",
    "Standard transit connections chosen, balance between speed and comfort.": "സാധാരണ ട്രാൻസിറ്റ് കണക്ഷനുകൾ തിരഞ്ഞെടുത്തിരിക്കുന്നു, വേഗതയും സുഖസൗകര്യങ്ങളും തമ്മിലുള്ള സന്തുലിതാവസ്ഥ.",
    "Routes completely mapped via step-free platforms, working elevators, and ramped vehicle entries.": "സ്റ്റെപ്പ് രഹിത പ്ലാറ്റ്‌ഫോമുകൾ, ലിഫ്റ്റുകൾ, റാംപ് ചെയ്ത വാഹന പ്രവേശനം എന്നിവയിലൂടെയുള്ള വഴികൾ പൂർണ്ണമായി മാപ്പ് ചെയ്തിരിക്കുന്നു.",
    "Route includes minor stairs at street levels. Switch profile to Wheelchair for step-free alternatives.": "റോഡ് തലങ്ങളിൽ ചെറിയ പടികൾ ഉണ്ട്. സ്റ്റെപ്പ് രഹിത ബദലുകൾക്കായി വീൽചെയർ പ്രൊഫൈലിലേക്ക് മാറ്റുക.",
    "Prioritized well-lit streets, high-density areas, and proximity to security checkpoints/hospitals.": "നന്നായി വെളിച്ചമുള്ള തെരുവുകൾക്കും ജനസാന്ദ്രതയേറിയ പ്രദേശങ്ങൾക്കും സെക്യൂരിറ്റി ചെക്ക് പോയിന്റുകൾ/ആശുപത്രികൾ എന്നിവയ്ക്കും മുൻഗണന നൽകുന്നു.",
    "Standard travel route. Safety mode toggle can be activated for reinforced security routing.": "സാധാരണ യാത്രാ വഴി. സുരക്ഷാ റൂട്ടിംഗിനായി സുരക്ഷാ മോഡ് ടോഗിൾ സജീവമാക്കാവുന്നതാണ്.",
    "Prioritized public bus networks and shared transit over private cabs, saving up to 80%.": "സ്വകാര്യ ക്യാബുകൾക്ക് പകരം പൊതു ബസ് ശൃംഖലകൾക്കും പങ്കിട്ട ട്രാൻസിറ്റിനും മുൻഗണന നൽകി, 80% വരെ ലാഭിക്കുന്നു.",
    "Standard transit ticket prices. Eco-saver public routes are available for lower budgets.": "സാധാരണ യാത്രാ നിരക്കുകൾ. കുറഞ്ഞ ബജറ്റുകൾക്കായി ഇക്കോ സേവർ പൊതു വഴികൾ ലഭ്യമാണ്.",
    "Selected shared electric transit and walking pathways, saving 2.5kg of CO₂.": "പങ്കിട്ട ഇലക്ട്രിക് ട്രാൻസിറ്റും കാൽനടപ്പാതകളും തിരഞ്ഞെടുത്തു, ഇത് 2.5 കിലോഗ്രാം കാർബൺ ലാഭിക്കുന്നു.",
    "Standard public transit route. Green footprint options available.": "സാധാരണ പൊതു ട്രാൻസിറ്റ് വഴി. ഹരിത കാൽപ്പാട് ഓപ്ഷനുകൾ ലഭ്യമാണ്.",
    "Morning Departure": "രാവിലെ പുറപ്പെടൽ",
    "Boarding Kochi Metro from Aluva Station towards Marine Drive or accessible low-floor AC transit.": "ആലുവ സ്റ്റേഷനിൽ നിന്ന് മരീൻ ഡ്രൈവിലേക്ക് കൊച്ചി മെട്രോയിലോ ലോ ഫ്ലോർ എസി ബസിലോ കയറുന്നു.",
    "Explore Marine Drive Walkway": "മറൈൻ ഡ്രൈവ് വോക്ക്‌വേ സന്ദർശിക്കുക",
    "Scenic promenade overlooking Kochi backwaters. Features accessible wide ramps, benches, and clean rest stops.": "കൊച്ചിൻ കായലിന്റെ മനോഹരമായ കാഴ്ച നൽകുന്ന നടപ്പാത. വീൽചെയർ റാംപുകൾ, ബെഞ്ചുകൾ, വിശ്രമമുറികൾ എന്നിവയുണ്ട്.",
    "Lunch Stop - Local Culinary Experience": "ഉച്ചഭക്ഷണം - പ്രാദേശിക വിഭവങ്ങൾ",
    "Enjoy traditional Kerala seafood and vegetarian thali at Paragon Restaurant or a cozy cafe nearby.": "പാരഗൺ റെസ്റ്റോറന്റിലോ അടുത്തുള്ള കഫേയിലോ പരമ്പരാഗത കേരളീയ സീഫുഡും വെജിറ്റേറിയൻ ഊണും ആസ്വദിക്കുക.",
    "Relax at Subhash Bose Park": "സുഭാഷ് ബോസ് പാർക്കിൽ വിശ്രമിക്കുക",
    "Lush green community park. Well-lit pathways, security patrols, and wheel-friendly entry gates.": "ഹരിതാഭമായ കമ്മ്യൂണിറ്റി പാർക്ക്. വെളിച്ചമുള്ള പാതകൾ, സെക്യൂരിറ്റി പട്രോളിംഗ്, വീൽ ഫ്രണ്ട്‌ലി ഗേറ്റുകൾ.",
    "Sunset Cruise & Safety Checkpoint": "സൂര്യാസ്തമയ യാത്രയും സുരക്ഷാ പരിശോധനയും",
    "Take the governmental water metro ferry (100% wheelchair friendly and guarded). Returns to base point.": "ഗവൺമെന്റ് വാട്ടർ മെട്രോ ഫെറി ഉപയോഗിക്കുക (100% വീൽചെയർ സൗഹൃദവും സുരക്ഷിതവുമാണ്). തിരികെ എത്തുന്നു.",
    "Delicious quick bites and refreshments at a highly-rated, budget-friendly cafe nearby.": "അടുത്തുള്ള മികച്ച റേറ്റിംഗുള്ള ബഡ്ജറ്റ് ഫ്രണ്ട്‌ലി കഫേയിൽ നിന്നുള്ള രുചികരമായ ഭക്ഷണം.",
    "Afternoon Rest Spot": "ഉച്ചകഴിഞ്ഞുള്ള വിശ്രമ സ്ഥലം",
    "Cozy rest area and public gardens. Quiet benches and clean facilities available.": "മനോഹരമായ വിശ്രമസ്ഥലവും പാർക്കുകളും. ബെഞ്ചുകളും വൃത്തിയുള്ള സൗകര്യങ്ങളും ലഭ്യമാണ്.",
    "Return commute via primary, high-patrol transit lines. Fully lit walkways and immediate help-points.": "പ്രധാന പട്രോളിംഗ് ഉള്ള ട്രാൻസിറ്റ് ലൈനുകൾ വഴിയുള്ള മടക്ക യാത്ര. വെളിച്ചമുള്ള നടപ്പാതകളും ഹെൽപ്പ് പോയിന്റുകളും.",
    "Safe Commute Return": "സുരക്ഷിതമായ മടക്ക യാത്ര",
    "Kochi Metro provides tactile paving and dedicated wheelchair anchors in all compartments. Boarding is 100% accessible.": "കൊച്ചി മെട്രോ എല്ലാ കോച്ചുകളിലും ടാക്റ്റൈൽ പാവിംഗും വീൽചെയർ ആങ്കറുകളും നൽകുന്നു. ബോർഡിംഗ് 100% സുഗമമാണ്.",
    "Monsoon humidity is high (84%). Brief afternoon showers predicted; carry an umbrella and prefer AC transit options.": "മഴക്കാലത്തെ ഈർപ്പം കൂടുതലാണ് (84%). ഉച്ചതിരിഞ്ഞ് ചെറിയ മഴയ്ക്ക് സാധ്യതയുണ്ട്; കുട കരുതുക, എസി യാത്രാ ഓപ്ഷനുകൾ തിരഞ്ഞെടുക്കുക.",
    "Women's Help desks are available at Kochi Metro stations. Pink Patrol vehicles are active around Marine Drive walkway.": "കൊച്ചി മെട്രോ സ്റ്റേഷനുകളിൽ വനിതാ ഹെൽപ്പ് ഡെസ്കുകൾ ലഭ്യമാണ്. മരീൻ ഡ്രൈവ് വോക്ക്‌വേയിൽ പിങ്ക് പട്രോൾ വാഹനങ്ങൾ സജീവമാണ്.",
    "Paragon Restaurant near Marine Drive is famous for Biryani and has step-free ground floor seating.": "മറൈൻ ഡ്രൈവിന് സമീപമുള്ള പാരഗൺ റെസ്റ്റോറന്റ് ബിരിയാണിക്ക് പ്രശസ്തമാണ്, ഇവിടെ പടികളില്ലാത്ത സീറ്റിംഗ് സൗകര്യമുണ്ട്.",
    "Selected transit stations feature step-free platform access and operational elevators. Highly recommended for strollers.": "തിരഞ്ഞെടുത്ത സ്റ്റേഷനുകളിൽ പടികളില്ലാത്ത പ്രവേശനവും ലിഫ്റ്റുകളും ഉണ്ട്. കുട്ടികളുടെ വണ്ടികൾക്ക് വളരെ അനുയോജ്യം.",
    "Partly cloudy with mild winds. High chance of light showers after 4:00 PM. Indoor sightseeing recommended for late afternoon.": "ഭാഗികമായി മേഘാവൃതമായ ആകാശം. വൈകുന്നേരം 4 മണിക്ക് ശേഷം ചെറിയ മഴയ്ക്ക് സാധ്യതയുണ്ട്. ഉച്ചതിരിഞ്ഞ് ഇൻഡോർ സന്ദർശനം ശുപാർശ ചെയ്യുന്നു.",
    "Primary streets are highly crowded and well-lit. Police assistance booths are located near the main station entrances.": "പ്രധാന തെരുവുകൾ തിരക്കേറിയതും വെളിച്ചമുള്ളതുമാണ്. പോലീസ് സഹായ ബൂത്തുകൾ പ്രധാന സ്റ്റേഷൻ കവാടങ്ങൾക്ക് സമീപം ഉണ്ട്.",
    "Local street market features quick grab-and-go options under ₹400 per person. Very budget friendly.": "പ്രാദേശിക തെരുവ് വിപണിയിൽ ഒരാൾക്ക് ₹400-ൽ താഴെ ചിലവിൽ ഭക്ഷണം ലഭിക്കും. വളരെ ബഡ്ജറ്റ് ഫ്രണ്ട്‌ലി."
  }
};

function translateText(text: string, lang: string): string {
  if (lang === "en" || !lang) return text;
  const dict = localTranslations[lang];
  if (!dict) return text;
  
  if (dict[text]) return dict[text];
  
  // Handle partial string replacements or templates
  let result = text;
  for (const key of Object.keys(dict)) {
    if (result.includes(key)) {
      result = result.replace(new RegExp(key, "g"), dict[key]);
    }
  }
  return result;
}

// Generate dynamic AI Travel plan
export async function generateDynamicPlan(params: {
  from: string;
  to: string;
  budget: number;
  preferences: TravelPreference[];
  safetyMode: boolean;
  isOffline: boolean;
  language?: string;
}): Promise<DynamicAiPlan> {
  const { from, to, budget, preferences, safetyMode, language = "en" } = params;

  // Determine locations context
  const isKochi = from.toLowerCase().includes("kochi") || to.toLowerCase().includes("kochi") || 
                  from.toLowerCase().includes("airport") || to.toLowerCase().includes("marine drive");

  // Default localized parameters
  const currencySymbol = "₹";
  const targetLangName = language === "hi" ? "Hindi (हिन्दी)" : language === "ml" ? "Malayalam (മലയാളം)" : "English";

  if (genAI && !params.isOffline) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are FlowRoute AI, a smart travel companion.
      Generate a travel plan from "${from}" to "${to}".
      Budget constraint: ${currencySymbol}${budget}.
      Preferences: ${preferences.join(", ")}.
      Women's Safety Mode: ${safetyMode ? "ENABLED" : "DISABLED"}.
      
      CRITICAL: Write all user-facing text values (reasons, activities, descriptions, messages) in ${targetLangName}. Keep JSON keys strictly in English.
      
      Respond with a JSON containing:
      1. "explainability": array of 5 explainability items (Shortest travel time, Wheelchair accessible, Safer roads, Lower cost, Lower carbon emissions). Each has: "label" (string - in ${targetLangName}), "checked" (boolean - does it fit?), and "reason" (string - short explanation why in ${targetLangName}).
      2. "itinerary": array of 5 itinerary segments showing a structured travel experience including morning/afternoon/evening, food stop, tourist attraction, and rest stop. Each segment has: "time" (string), "activity" (string - in ${targetLangName}), "description" (string - in ${targetLangName}), "type" (one of "travel", "attraction", "food", "rest", "safety"), and "location" (string - in ${targetLangName}).
      3. "aiSuggestions": array of 4 AI suggestion items matching the prompt with fields: "id" (string), "icon" (emoji), "category" (one of "accessibility", "weather", "health", "food", "safety", "time", "eco"), "message" (string - in ${targetLangName}), "severity" (one of "info", "warning", "tip").
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
      label: translateText("Shortest travel time", language),
      checked: preferences.includes("fastest") || preferences.length === 1,
      reason: preferences.includes("fastest") 
        ? translateText("Optimized route through primary express lines saves 15 minutes.", language) 
        : translateText("Standard transit connections chosen, balance between speed and comfort.", language)
    },
    {
      label: translateText("Wheelchair accessible", language),
      checked: preferences.includes("wheelchair") || preferences.includes("elderly"),
      reason: (preferences.includes("wheelchair") || preferences.includes("elderly"))
        ? translateText("Routes completely mapped via step-free platforms, working elevators, and ramped vehicle entries.", language)
        : translateText("Route includes minor stairs at street levels. Switch profile to Wheelchair for step-free alternatives.", language)
    },
    {
      label: translateText("Safer roads", language),
      checked: safetyMode || preferences.includes("family"),
      reason: safetyMode
        ? translateText("Prioritized well-lit streets, high-density areas, and proximity to security checkpoints/hospitals.", language)
        : translateText("Standard travel route. Safety mode toggle can be activated for reinforced security routing.", language)
    },
    {
      label: translateText("Lower cost", language),
      checked: preferences.includes("budget") || preferences.includes("backpacker") || budget < 3000,
      reason: (preferences.includes("budget") || preferences.includes("backpacker"))
        ? translateText("Prioritized public bus networks and shared transit over private cabs, saving up to 80%.", language)
        : translateText("Standard transit ticket prices. Eco-saver public routes are available for lower budgets.", language)
    },
    {
      label: translateText("Lower carbon emissions", language),
      checked: preferences.includes("eco") || preferences.includes("wheelchair") || preferences.includes("budget"),
      reason: preferences.includes("eco")
        ? translateText("Selected shared electric transit and walking pathways, saving 2.5kg of CO₂.", language)
        : translateText("Standard public transit route. Green footprint options available.", language)
    }
  ];

  // Kochi Localized Itinerary Fallback
  const kochiItinerary: ItinerarySegment[] = [
    {
      time: "09:00 AM",
      activity: translateText("Morning Departure", language),
      description: translateText("Boarding Kochi Metro from Aluva Station towards Marine Drive or accessible low-floor AC transit.", language),
      type: "travel",
      location: from
    },
    {
      time: "10:30 AM",
      activity: translateText("Explore Marine Drive Walkway", language),
      description: translateText("Scenic promenade overlooking Kochi backwaters. Features accessible wide ramps, benches, and clean rest stops.", language),
      type: "attraction",
      location: translateText("Explore Marine Drive Walkway", language)
    },
    {
      time: "01:00 PM",
      activity: translateText("Lunch Stop - Local Culinary Experience", language),
      description: translateText("Enjoy traditional Kerala seafood and vegetarian thali at Paragon Restaurant or a cozy cafe nearby.", language),
      type: "food",
      location: "Paragon Restaurant, Kochi"
    },
    {
      time: "03:30 PM",
      activity: translateText("Relax at Subhash Bose Park", language),
      description: translateText("Lush green community park. Well-lit pathways, security patrols, and wheel-friendly entry gates.", language),
      type: "rest",
      location: "Subhash Park, Ernakulam"
    },
    {
      time: "06:00 PM",
      activity: translateText("Sunset Cruise & Safety Checkpoint", language),
      description: translateText("Take the governmental water metro ferry (100% wheelchair friendly and guarded). Returns to base point.", language),
      type: "safety",
      location: "Ernakulam Jetty"
    }
  ];

  // London / Generic Localized Itinerary Fallback
  const genericItinerary: ItinerarySegment[] = [
    {
      time: "09:30 AM",
      activity: translateText("Morning Departure", language),
      description: translateText(`Boarding the step-free accessible Circle Line or bus connections towards `, language) + to,
      type: "travel",
      location: from
    },
    {
      time: "11:00 AM",
      activity: translateText("Sightseeing and Landmarks", language),
      description: translateText(`Visiting the iconic spaces around `, language) + to + translateText(". Pedestrian friendly lanes and active information guides.", language),
      type: "attraction",
      location: to
    },
    {
      time: "12:30 PM",
      activity: translateText("Lunch at Local Hub", language),
      description: translateText("Delicious quick bites and refreshments at a highly-rated, budget-friendly cafe nearby.", language),
      type: "food",
      location: `${to} Food Market`
    },
    {
      time: "02:30 PM",
      activity: translateText("Afternoon Rest Spot", language),
      description: translateText("Cozy rest area and public gardens. Quiet benches and clean facilities available.", language),
      type: "rest",
      location: "City Garden Plaza"
    },
    {
      time: "05:00 PM",
      activity: translateText("Safe Commute Return", language),
      description: translateText("Return commute via primary, high-patrol transit lines. Fully lit walkways and immediate help-points.", language),
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
      message: translateText("Kochi Metro provides tactile paving and dedicated wheelchair anchors in all compartments. Boarding is 100% accessible.", language),
      severity: "info"
    },
    {
      id: "sug-2",
      icon: "☔",
      category: "weather",
      message: translateText("Monsoon humidity is high (84%). Brief afternoon showers predicted; carry an umbrella and prefer AC transit options.", language),
      severity: "warning"
    },
    {
      id: "sug-3",
      icon: "🚔",
      category: "safety",
      message: translateText("Women's Help desks are available at Kochi Metro stations. Pink Patrol vehicles are active around Marine Drive walkway.", language),
      severity: "tip"
    },
    {
      id: "sug-4",
      icon: "🥗",
      category: "food",
      message: translateText("Paragon Restaurant near Marine Drive is famous for Biryani and has step-free ground floor seating.", language),
      severity: "tip"
    }
  ];

  const genericSuggestions: AiSuggestion[] = [
    {
      id: "sug-1",
      icon: "🚇",
      category: "accessibility",
      message: translateText("Selected transit stations feature step-free platform access and operational elevators. Highly recommended for strollers.", language),
      severity: "info"
    },
    {
      id: "sug-2",
      icon: "🌦️",
      category: "weather",
      message: translateText("Partly cloudy with mild winds. High chance of light showers after 4:00 PM. Indoor sightseeing recommended for late afternoon.", language),
      severity: "warning"
    },
    {
      id: "sug-3",
      icon: "🛡️",
      category: "safety",
      message: translateText("Primary streets are highly crowded and well-lit. Police assistance booths are located near the main station entrances.", language),
      severity: "tip"
    },
    {
      id: "sug-4",
      icon: "🥪",
      category: "food",
      message: translateText("Local street market features quick grab-and-go options under ₹400 per person. Very budget friendly.", language),
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
