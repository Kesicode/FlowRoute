// ─── Journey Types ──────────────────────────────────────────────────────────

export type TransportMode = "walk" | "bus" | "metro" | "train" | "tram" | "taxi" | "bike";
export type TravelPreference =
  | "elderly"
  | "family"
  | "baby"
  | "wheelchair"
  | "budget"
  | "fastest"
  | "eco"
  | "foodie"
  | "tourist"
  | "backpacker";

export interface RouteSegment {
  mode: TransportMode;
  label: string;
  from: string;
  to: string;
  duration: number; // minutes
  distance: number; // meters
  fare: number; // INR (Indian Rupees)
  line?: string; // e.g. "Victoria Line"
  stops?: number;
  coordinates: [number, number][];
}

export interface JourneyRoute {
  id: string;
  name: string;
  tag: string; // e.g. "Fastest", "Eco", "Comfort"
  tagColor: "cyan" | "green" | "purple" | "amber" | "red";
  totalTime: number; // minutes
  walkingTime: number; // minutes
  totalFare: number; // GBP
  transfers: number;
  carbonKg: number;
  overallScore: number; // 0-100
  segments: RouteSegment[];
  isRecommended: boolean;
}

// ─── Weather Types ───────────────────────────────────────────────────────────

export interface WeatherDay {
  day: string;
  high: number;
  low: number;
  condition: string;
  icon: string; // emoji
  rainChance: number; // 0-100
}

export interface WeatherData {
  location: string;
  current: {
    temp: number;
    feelsLike: number;
    condition: string;
    icon: string;
    windSpeed: number;
    humidity: number;
    uvIndex: number;
    rainAlert: boolean;
    rainAlertMessage?: string;
  };
  forecast: WeatherDay[];
  clothingSuggestion: string;
}

// ─── Food Types ──────────────────────────────────────────────────────────────

export interface FoodStop {
  id: string;
  name: string;
  cuisine: string;
  type: "restaurant" | "cafe" | "fastfood" | "bakery" | "bar";
  rating: number;
  priceRange: "₹" | "₹₹" | "₹₹₹";
  estimatedCost: number;
  distanceFromRoute: number; // meters
  openNow: boolean;
  address: string;
  highlights: string[];
  coordinate: [number, number];
}

// ─── Essentials Types ────────────────────────────────────────────────────────

export type EssentialType = "hospital" | "pharmacy" | "atm" | "restroom" | "fuel";

export interface Essential {
  id: string;
  name: string;
  type: EssentialType;
  distance: number; // meters
  address: string;
  openNow: boolean;
  coordinate: [number, number];
}

// ─── Attractions Types ───────────────────────────────────────────────────────

export interface Attraction {
  id: string;
  name: string;
  category: string;
  rating: number;
  distance: number; // meters from route
  description: string;
  estimatedTime: number; // minutes to visit
  free: boolean;
  entryFee?: number;
  coordinate: [number, number];
  emoji: string;
}

// ─── Budget Types ────────────────────────────────────────────────────────────

export interface BudgetBreakdown {
  transport: number;
  food: number;
  attractions: number;
  miscellaneous: number;
  total: number;
  currency: string;
  perPersonTotal: number;
  travellers: number;
}

// ─── Carbon Types ────────────────────────────────────────────────────────────

export interface CarbonData {
  selectedRouteCO2: number; // kg
  alternatives: {
    mode: string;
    co2: number;
    label: string;
  }[];
  treesEquivalent: number;
  savingVsCar: number; // kg saved vs driving alone
  greenTip: string;
}

// ─── AI Suggestions ──────────────────────────────────────────────────────────

export interface AiSuggestion {
  id: string;
  icon: string; // emoji
  category: "accessibility" | "weather" | "health" | "food" | "safety" | "time" | "eco";
  message: string;
  severity: "info" | "warning" | "tip";
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface RecentJourney {
  id: string;
  from: string;
  to: string;
  date: string;
  mode: TransportMode;
  cost: number;
  duration: number; // minutes
  co2: number;
}

export interface FavouriteDestination {
  id: string;
  name: string;
  country: string;
  emoji: string;
  lastVisited: string;
  totalVisits: number;
}

export interface TravelStat {
  label: string;
  value: string;
  unit: string;
  icon: string;
  trend: "up" | "down" | "neutral";
}

// ─── Full Journey Plan ───────────────────────────────────────────────────────

export interface JourneyPlan {
  id: string;
  from: string;
  to: string;
  date: string;
  travellers: number;
  budget: number;
  preferences: TravelPreference[];
  routes: JourneyRoute[];
  weather: WeatherData;
  foodStops: FoodStop[];
  essentials: Essential[];
  attractions: Attraction[];
  budget_breakdown: BudgetBreakdown;
  carbon: CarbonData;
  aiSuggestions: AiSuggestion[];
}
