"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Route as RouteIcon,
  CloudSun,
  Utensils,
  ShieldCheck,
  Landmark,
  IndianRupee,
  Leaf,
  Sparkles,
  ArrowLeft,
  Loader2,
  Calendar,
  WifiOff,
  CreditCard,
  Map,
  List,
} from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/lib/settings-context";
import { t } from "@/services/translations";
import { searchLocations } from "@/services/geocoding";
import { getRoute, RouteData } from "@/services/routing";
import { getWeather } from "@/services/weather";
import { fetchNearbyPlaces } from "@/services/overpass";
import { generateDynamicPlan, DynamicAiPlan } from "@/services/ai";
import MapWrapper from "@/components/map-wrapper";
import { Location, WeatherCondition } from "@/types/planner";
import { FoodStop, Essential, Attraction, JourneyRoute, WeatherData, BudgetBreakdown, CarbonData, TravelPreference } from "@/types/journey";

// Import panels
import { RoutePanel } from "@/components/journey/route-panel";
import { WeatherPanel } from "@/components/journey/weather-panel";
import { FoodPanel } from "@/components/journey/food-panel";
import { EssentialsPanel } from "@/components/journey/essentials-panel";
import { AttractionsPanel } from "@/components/journey/attractions-panel";
import { BudgetPanel } from "@/components/journey/budget-panel";
import { CarbonPanel } from "@/components/journey/carbon-panel";
import { AiSuggestionsPanel } from "@/components/journey/ai-suggestions-panel";
import { ItineraryPanel } from "@/components/journey/itinerary-panel";
import { ExplainabilityPanel } from "@/components/journey/explainability-panel";
import { TicketBooking } from "@/components/ticket-booking";

type Tab = {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
};

function JourneyContent() {
  const searchParams = useSearchParams();
  const { language, safetyMode, setSafetyMode } = useSettings();
  
  const [activeTab, setActiveTab] = useState("route");
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"routes" | "map">("routes");

  // Search parameters
  const from = searchParams.get("from") || "Kochi Airport";
  const to = searchParams.get("to") || "Marine Drive";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const budgetParam = Number(searchParams.get("budget") || "5000");
  const travellers = Number(searchParams.get("travellers") || "1");
  const preferencesParam = searchParams.get("preferences") || "";
  const safetyParam = searchParams.get("safety") === "true";

  // Dynamic state loaded from real APIs
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [duration, setDuration] = useState(0); // seconds
  
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [foodStops, setFoodStops] = useState<FoodStop[]>([]);
  const [essentials, setEssentials] = useState<Essential[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  
  const [aiPlan, setAiPlan] = useState<DynamicAiPlan | null>(null);
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdown | null>(null);
  const [carbon, setCarbon] = useState<CarbonData | null>(null);
  const [activeSegmentCoords, setActiveSegmentCoords] = useState<[number, number][] | null>(null);

  // Trigger safety mode state if query param exists
  useEffect(() => {
    if (safetyParam) {
      setSafetyMode(true);
    }
  }, [safetyParam, setSafetyMode]);

  useEffect(() => {
    async function loadJourneyData() {
      setLoading(true);
      
      // Determine if offline
      const offline = typeof window !== "undefined" ? !window.navigator.onLine : false;
      setIsOfflineMode(offline);

      try {
        // 1. Geocode Locations
        const originRes = await searchLocations(from);
        const destRes = await searchLocations(to);

        let originLoc = originRes.length > 0 ? originRes[0] : { name: from, displayName: from, lat: 10.1518, lng: 76.3929 };
        let destLoc = destRes.length > 0 ? destRes[0] : { name: to, displayName: to, lat: 9.9806, lng: 76.2758 };

        // Fallbacks for standard demo keywords if Geocoder returns nothing
        if (from.toLowerCase().includes("kochi airport")) {
          originLoc = { name: "Kochi Airport", displayName: "Cochin International Airport (COK), Kerala, India", lat: 10.1518, lng: 76.3929 };
        }
        if (to.toLowerCase().includes("marine drive")) {
          destLoc = { name: "Marine Drive", displayName: "Marine Drive Promenade, Kochi, Kerala, India", lat: 9.9806, lng: 76.2758 };
        }

        setOrigin(originLoc);
        setDestination(destLoc);

        // 2. Fetch OSRM route geometry
        let routeData: RouteData | null = null;
        if (!offline) {
          routeData = await getRoute(originLoc, destLoc);
        }

        const routeCoords = routeData?.geometry || [
          [originLoc.lat, originLoc.lng],
          [destLoc.lat, destLoc.lng]
        ];
        const routeDist = routeData?.distance || 28500; // 28.5km default
        const routeDur = routeData?.duration || 1920; // 32 minutes default

        setRouteGeometry(routeCoords);
        setDuration(routeDur);

        // 3. Fetch Weather
        let weatherData: WeatherCondition | null = null;
        if (!offline) {
          weatherData = await getWeather(destLoc.lat, destLoc.lng);
        }

        const resolvedWeather: WeatherData = {
          location: destLoc.displayName.split(",").slice(0, 2).join(", "),
          current: {
            temp: weatherData?.temp || 28,
            feelsLike: weatherData?.temp ? weatherData.temp + 1 : 29,
            condition: weatherData?.type || "Sunny",
            icon: weatherData?.iconName === "cloud-rain" ? "🌧️" : "☀️",
            windSpeed: weatherData?.windSpeed || 12,
            humidity: weatherData?.humidity || 75,
            uvIndex: 8,
            rainAlert: weatherData?.iconName === "cloud-rain",
            rainAlertMessage: "Light monsoon showers predicted. Pack an umbrella."
          },
          forecast: [
            { day: "Today", high: weatherData?.temp || 28, low: (weatherData?.temp || 28) - 4, condition: weatherData?.type || "Sunny", icon: weatherData?.iconName === "cloud-rain" ? "🌧️" : "☀️", rainChance: weatherData?.iconName === "cloud-rain" ? 80 : 10 },
            { day: "Tomorrow", high: 29, low: 24, condition: "Partly Cloudy", icon: "⛅", rainChance: 25 },
            { day: "Day 3", high: 30, low: 25, condition: "Sunny", icon: "☀️", rainChance: 10 },
            { day: "Day 4", high: 28, low: 24, condition: "Rainy", icon: "🌧️", rainChance: 90 },
            { day: "Day 5", high: 29, low: 23, condition: "Showers", icon: "🌦️", rainChance: 60 }
          ],
          clothingSuggestion: "Light breathable cotton shirts. Carrying rain gear is recommended."
        };
        setWeather(resolvedWeather);

        // 4. Fetch amenities nearby using Overpass API
        const pois = await fetchNearbyPlaces(destLoc.lat, destLoc.lng);
        setFoodStops(pois.foodStops);
        setEssentials(pois.essentials);
        setAttractions(pois.attractions);

        // 5. Query AI Assistant Service for dynamically generated travel context
        const parsedPrefs = preferencesParam.split(",").filter(p => p.length > 0) as TravelPreference[];
        const plan = await generateDynamicPlan({
          from: originLoc.name,
          to: destLoc.name,
          budget: budgetParam,
          preferences: parsedPrefs,
          safetyMode,
          isOffline: offline,
          language
        });
        setAiPlan(plan);

        // 6. Assemble dynamic budget breakdown
        const travelCost = Math.round(((routeDist / 1000) * 8) * travellers);
        const foodCost = 450 * travellers;
        const sightsCost = Math.round(pois.attractions.reduce((acc, curr) => acc + (curr.entryFee || 0), 0) / 2);
        const miscCost = 150 * travellers;
        const totalBudget = travelCost + foodCost + sightsCost + miscCost;
        
        const breakdown: BudgetBreakdown = {
          transport: travelCost,
          food: foodCost,
          attractions: sightsCost,
          miscellaneous: miscCost,
          total: totalBudget,
          currency: "INR",
          perPersonTotal: totalBudget / travellers,
          travellers
        };
        setBudgetBreakdown(breakdown);

        // 7. Assemble dynamic Carbon comparisons
        const selectedRouteCO2 = parseFloat(((routeDist / 1000) * 0.05).toFixed(1));
        const carbonData: CarbonData = {
          selectedRouteCO2,
          alternatives: [
            { mode: "Private Car", co2: parseFloat(((routeDist / 1000) * 0.22).toFixed(1)), label: `${parseFloat(((routeDist / 1000) * 0.22).toFixed(1))} kg` },
            { mode: "Taxi / Cab", co2: parseFloat(((routeDist / 1000) * 0.18).toFixed(1)), label: `${parseFloat(((routeDist / 1000) * 0.18).toFixed(1))} kg` },
            { mode: "Bus Transport", co2: parseFloat(((routeDist / 1000) * 0.03).toFixed(1)), label: `${parseFloat(((routeDist / 1000) * 0.03).toFixed(1))} kg` },
            { mode: "Metro Rail (yours)", co2: selectedRouteCO2, label: `${selectedRouteCO2} kg` },
            { mode: "Walking", co2: 0.0, label: "Zero CO₂" }
          ],
          treesEquivalent: parseFloat((selectedRouteCO2 * 0.08).toFixed(2)),
          savingVsCar: parseFloat((((routeDist / 1000) * 0.22) - selectedRouteCO2).toFixed(1)),
          greenTip: `Choosing electric metro transit over individual private vehicles saves ${parseFloat((((routeDist / 1000) * 0.17)).toFixed(1))} kg of CO₂ emissions for this ride!`
        };
        setCarbon(carbonData);

        // 8. Assemble dynamic Routes suggestions list
        const routeMinutes = Math.round(routeDur / 60);
        const tRoute = (key: any) => t(key, language);

        const metroRoute: JourneyRoute = {
          id: "route-metro-dynamic",
          name: tRoute("expressMetro"),
          tag: tRoute("fastestChoice"),
          tagColor: "cyan",
          totalTime: routeMinutes,
          walkingTime: Math.round(routeMinutes * 0.2),
          totalFare: travelCost,
          transfers: 1,
          carbonKg: selectedRouteCO2,
          overallScore: plan.accessibilityScore,
          isRecommended: true,
          segments: [
            {
              mode: "walk",
              label: tRoute("walkToGate"),
              from: originLoc.name,
              to: tRoute("metroTerminal"),
              duration: Math.round(routeMinutes * 0.1),
              distance: Math.round(routeDist * 0.05),
              fare: 0,
              coordinates: [routeCoords[0], routeCoords[Math.floor(routeCoords.length * 0.15)]]
            },
            {
              mode: "metro",
              label: tRoute("kochiMetroLine"),
              from: tRoute("metroTerminal"),
              to: tRoute("destHubGate"),
              duration: Math.round(routeMinutes * 0.8),
              distance: Math.round(routeDist * 0.9),
              fare: travelCost,
              line: "Blue Line Transit",
              stops: 9,
              coordinates: routeCoords.slice(Math.floor(routeCoords.length * 0.15), Math.floor(routeCoords.length * 0.9))
            },
            {
              mode: "walk",
              label: `${tRoute("walkToDest")} ${destLoc.name}`,
              from: tRoute("destHubGate"),
              to: destLoc.name,
              duration: Math.round(routeMinutes * 0.1),
              distance: Math.round(routeDist * 0.05),
              fare: 0,
              coordinates: [routeCoords[Math.floor(routeCoords.length * 0.9)], routeCoords[routeCoords.length - 1]]
            }
          ]
        };

        const ecoRoute: JourneyRoute = {
          id: "route-eco-dynamic",
          name: tRoute("greenerBus"),
          tag: tRoute("ecoFriendly"),
          tagColor: "green",
          totalTime: Math.round(routeMinutes * 1.35),
          walkingTime: Math.round(routeMinutes * 0.35),
          totalFare: Math.round(travelCost * 0.45),
          transfers: 0,
          carbonKg: parseFloat((selectedRouteCO2 * 0.6).toFixed(2)),
          overallScore: Math.round(plan.accessibilityScore * 0.9),
          isRecommended: false,
          segments: [
            {
              mode: "bus",
              label: tRoute("electricBus"),
              from: originLoc.name,
              to: destLoc.name,
              duration: Math.round(routeMinutes * 1.25),
              distance: routeDist,
              fare: Math.round(travelCost * 0.45),
              line: "Eco Transit",
              coordinates: routeCoords
            }
          ]
        };

        const cabRoute: JourneyRoute = {
          id: "route-comfort-dynamic",
          name: tRoute("directTaxi"),
          tag: safetyMode ? tRoute("safeCorridor") : tRoute("comfortChoice"),
          tagColor: "purple",
          totalTime: Math.round(routeMinutes * 0.85),
          walkingTime: 2,
          totalFare: Math.round(((routeDist / 1000) * 22) * travellers),
          transfers: 0,
          carbonKg: parseFloat((selectedRouteCO2 * 4.5).toFixed(2)),
          overallScore: safetyMode ? plan.safetyScore : Math.round(plan.safetyScore * 0.85),
          isRecommended: false,
          segments: [
            {
              mode: "taxi",
              label: tRoute("securedCab"),
              from: originLoc.name,
              to: destLoc.name,
              duration: Math.round(routeMinutes * 0.85),
              distance: routeDist,
              fare: Math.round(((routeDist / 1000) * 22) * travellers),
              coordinates: routeCoords
            }
          ]
        };

        setRoutes([metroRoute, ecoRoute, cabRoute]);

      } catch (err) {
        console.error("Error building dynamic journey plan:", err);
      } finally {
        setLoading(false);
      }
    }

    loadJourneyData();
  }, [from, to, date, budgetParam, travellers, preferencesParam, safetyMode]);

  // Auto-select first route once routes load
  useEffect(() => {
    if (routes.length > 0 && !selectedRouteId) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  const handleRouteSelect = useCallback((route: JourneyRoute) => {
    setSelectedRouteId(route.id);
    setActiveSegmentCoords(null);
  }, []);

  const handleRouteHover = useCallback((route: JourneyRoute | null) => {
    if (route) setSelectedRouteId(route.id);
  }, []);

  const tabs: Tab[] = [
    { id: "route", label: t("tabRoute", language), icon: RouteIcon },
    { id: "booking", label: language === "en" ? "Tickets" : language === "hi" ? "टिकट" : "ടിക്കറ്റുകൾ", icon: CreditCard },
    { id: "explainability", label: t("whyThisRoute", language) === "Why this route?" ? "AI Audit" : "ഓഡിറ്റ്", icon: ShieldCheck },
    { id: "itinerary", label: t("tabItinerary", language), icon: Calendar },
    { id: "weather", label: t("tabWeather", language), icon: CloudSun },
    { id: "food", label: t("tabFood", language), icon: Utensils, badge: foodStops.length || undefined },
    { id: "essentials", label: t("tabEssentials", language), icon: ShieldCheck, badge: essentials.length || undefined },
    { id: "attractions", label: t("tabSights", language), icon: Landmark, badge: attractions.length || undefined },
    { id: "budget", label: t("tabBudget", language), icon: IndianRupee },
    { id: "carbon", label: t("tabCarbon", language), icon: Leaf },
    { id: "ai", label: t("tabAiTips", language), icon: Sparkles },
  ];

  const panelContent: Record<string, React.ReactNode> = {
    route: <RoutePanel routes={routes} onSelectSegment={setActiveSegmentCoords} />,
    booking: (
      <TicketBooking
        hasRoute={routes.length > 0}
        price={routes[0]?.totalFare || budgetBreakdown?.total || 280}
        from={origin?.name}
        to={destination?.name}
        date={date}
        travellers={travellers}
      />
    ),
    explainability: <ExplainabilityPanel metrics={aiPlan?.explainability || []} />,
    itinerary: <ItineraryPanel itinerary={aiPlan?.itinerary || []} />,
    weather: weather ? <WeatherPanel weather={weather} /> : null,
    food: <FoodPanel foodStops={foodStops} />,
    essentials: <EssentialsPanel essentials={essentials} />,
    attractions: <AttractionsPanel attractions={attractions} />,
    budget: budgetBreakdown ? <BudgetPanel budgetBreakdown={budgetBreakdown} /> : null,
    carbon: carbon ? <CarbonPanel carbon={carbon} /> : null,
    ai: aiPlan ? <AiSuggestionsPanel aiSuggestions={aiPlan.aiSuggestions} /> : null,
  };

  const selectedRoute = routes.find(r => r.id === selectedRouteId) ?? null;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-background">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-brand-cyan/20 border-t-brand-cyan animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-brand-cyan animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-white font-display font-semibold text-lg">{t("planningJourney", language)}</p>
          <p className="text-slate-400 text-sm mt-1 animate-pulse">{t("planningJourneyDesc", language)}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile view toggle bar ── */}
      <div className="md:hidden flex items-center justify-center gap-2 py-2 px-4 border-b border-white/5 bg-black/30 shrink-0">
        <button
          onClick={() => setMobileView("routes")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            mobileView === "routes"
              ? "bg-brand-cyan/15 border-brand-cyan/30 text-brand-cyan"
              : "bg-transparent border-white/10 text-slate-400"
          }`}
        >
          <List className="w-3.5 h-3.5" /> Routes
        </button>
        <button
          onClick={() => setMobileView("map")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            mobileView === "map"
              ? "bg-brand-cyan/15 border-brand-cyan/30 text-brand-cyan"
              : "bg-transparent border-white/10 text-slate-400"
          }`}
        >
          <Map className="w-3.5 h-3.5" /> Map
        </button>
      </div>

      {/* ── Google Maps split layout ── */}
      <div className="journey-layout">

        {/* ── Left routes panel ── */}
        <div
          className={`left-panel ${
            mobileView === "map" ? "hidden md:flex" : "flex"
          } flex-col`}
        >
          {/* Sticky header inside scrollable panel */}
          <div className="sticky top-0 z-10 p-4 border-b border-white/5 bg-card/95 backdrop-blur-xl shrink-0">
            <Link
              href="/planner"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs mb-3 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> {t("backToPlanner", language)}
            </Link>

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-lg font-extrabold text-white">
                    {origin?.name} → {destination?.name}
                  </h1>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/25 font-bold animate-pulse">
                    ✓ {t("aiPlanReady", language)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {new Date(date).toLocaleDateString(language === "en" ? "en-GB" : language === "hi" ? "hi-IN" : "ml-IN", {
                    weekday: "short", day: "numeric", month: "long"
                  })}
                  &nbsp;·&nbsp;{travellers} {language === "en" ? `traveller${travellers !== 1 ? "s" : ""}` : language === "hi" ? "यात्री" : "യാത്രക്കാർ"}
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-2 mt-3">
              {[
                { label: t("estTime", language), value: `${Math.round(duration/60)} ${t("minLabel", language)}`, color: "text-brand-cyan" },
                { label: t("bestFare", language), value: `₹${routes[0]?.totalFare || 250}`, color: "text-emerald-400" },
                { label: t("tempLabel", language), value: `${weather?.current?.temp || 28}°C`, color: "text-brand-blue" },
              ].map((s) => (
                <div key={s.label} className="flex-1 py-2 px-1 glass-card rounded-xl border border-white/5 text-center">
                  <div className={`font-bold text-sm leading-none ${s.color}`}>{s.value}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wide mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Offline notice */}
          {isOfflineMode && (
            <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/20 text-[10px] text-amber-400 font-bold flex gap-1.5 items-center shrink-0">
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
              <span>{t("offlineNotice", language)}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex overflow-x-auto px-4 py-2 gap-1.5 border-b border-white/5 no-scrollbar snap-x-tabs bg-black/10 shrink-0 sticky top-[calc(theme(spacing.4)*2+theme(spacing.28))] z-10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border ${
                  activeTab === tab.id
                    ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/25"
                    : "bg-transparent text-slate-400 hover:text-slate-200 border-transparent"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.badge && (
                  <span className={`text-[8px] px-1 py-0.5 rounded-full font-bold ml-0.5 ${
                    activeTab === tab.id ? "bg-brand-cyan text-slate-950" : "bg-white/10 text-slate-500"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Panel content — grows and scrolls */}
          <div className="flex-1 p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === "route" ? (
                  <RoutePanel
                    routes={routes}
                    selectedRouteId={selectedRouteId}
                    onRouteSelect={handleRouteSelect}
                    onRouteHover={handleRouteHover}
                    onSelectSegment={setActiveSegmentCoords}
                  />
                ) : (
                  panelContent[activeTab]
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Sticky Map Panel ── */}
        <div
          className={`right-panel ${
            mobileView === "routes" ? "hidden md:block" : "block"
          }`}
        >
          <MapWrapper
            origin={origin}
            destination={destination}
            routeGeometry={routeGeometry}
            foodPlaces={foodStops}
            essentials={essentials}
            attractions={attractions}
            safetyMode={safetyMode}
            activeSegmentCoords={activeSegmentCoords || undefined}
            selectedRoute={selectedRoute}
            allRoutes={routes}
          />
        </div>

      </div>
    </>
  );
}

export default function JourneyPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-[70vh] bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
      </div>
    }>
      <JourneyContent />
    </Suspense>
  );
}
