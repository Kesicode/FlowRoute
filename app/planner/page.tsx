"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Calendar,
  Users,
  ArrowRightLeft,
  Loader2,
  X,
  Sparkles,
  Mic,
  MicOff,
  Shield,
  Accessibility,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { travelPreferences } from "@/lib/mockData";
import type { TravelPreference } from "@/types/journey";
import MapWrapper from "@/components/map-wrapper";
import { searchLocations } from "@/services/geocoding";
import { Location } from "@/types/planner";
import { useSettings } from "@/lib/settings-context";
import { t } from "@/services/translations";
import { useVoice } from "@/hooks/useVoice";
import { parseQueryWithAI } from "@/services/ai";
// Phase 1 — new planner components
import { TravelerProfileCard } from "@/components/planner/TravelerProfileCard";
import { DateRangePicker } from "@/components/planner/DateRangePicker";
import { AccommodationPrefsSelector } from "@/components/planner/AccommodationPrefsSelector";

/** Collapsible Phase 1 trip details section embedded in the planner form. */
function TripDetailsSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 hover:bg-white/10 transition-colors text-xs font-semibold text-slate-400"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>🗓 Trip Details &amp; Traveler Type</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="flex flex-col gap-4 p-3 bg-black/10">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Who is travelling?</p>
            <TravelerProfileCard />
          </div>
          <DateRangePicker />
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Accommodation type</p>
            <AccommodationPrefsSelector />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {

  const router = useRouter();
  const { language, safetyMode, setSafetyMode } = useSettings();
  
  // Voice Hook
  const { isListening, transcript, startListening, stopListening } = useVoice();

  // Mode tab: 'manual' | 'ai'
  const [plannerMode, setPlannerMode] = useState<"manual" | "ai">("manual");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);

  // Location state
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<Location[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Location[]>([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(false);
  const [showOriginPanel, setShowOriginPanel] = useState(false);
  const [showDestPanel, setShowDestPanel] = useState(false);

  // Journey config
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState(5000);
  const [travellers, setTravellers] = useState(1);
  const [selectedPreferences, setSelectedPreferences] = useState<TravelPreference[]>([]);
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ─── Voice transcript sync ──────────────────────────────────────────────
  useEffect(() => {
    if (transcript) {
      setAiPrompt(transcript);
    }
  }, [transcript]);

  const navTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const originAbortRef = useRef<AbortController | null>(null);
  const destAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  // ─── Geocoding debounce ─────────────────────────────────────────────────
  const originTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const destTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleOriginChange = (val: string) => {
    setOriginQuery(val);
    setShowOriginPanel(true);
    if (val === "") { setOrigin(null); return; }
    clearTimeout(originTimerRef.current);
    if (val.length >= 3) {
      setOriginLoading(true);
      originTimerRef.current = setTimeout(async () => {
        originAbortRef.current?.abort();
        originAbortRef.current = new AbortController();
        const res = await searchLocations(val, { signal: originAbortRef.current.signal });
        setOriginSuggestions(res);
        setOriginLoading(false);
      }, 400);
    }
  };

  const handleDestChange = (val: string) => {
    setDestQuery(val);
    setShowDestPanel(true);
    if (val === "") { setDestination(null); return; }
    clearTimeout(destTimerRef.current);
    if (val.length >= 3) {
      setDestLoading(true);
      destTimerRef.current = setTimeout(async () => {
        destAbortRef.current?.abort();
        destAbortRef.current = new AbortController();
        const res = await searchLocations(val, { signal: destAbortRef.current.signal });
        setDestSuggestions(res);
        setDestLoading(false);
      }, 400);
    }
  };

  const selectOrigin = (loc: Location) => {
    setOrigin(loc);
    setOriginQuery(loc.name);
    setOriginSuggestions([]);
    setShowOriginPanel(false);
  };

  const selectDestination = (loc: Location) => {
    setDestination(loc);
    setDestQuery(loc.name);
    setDestSuggestions([]);
    setShowDestPanel(false);
  };

  const swapLocations = () => {
    const tempLoc = origin;
    setOrigin(destination);
    setDestination(tempLoc);
    const tempQ = originQuery;
    setOriginQuery(destQuery);
    setDestQuery(tempQ);
    // Clear suggestion panels
    setOriginSuggestions([]);
    setDestSuggestions([]);
    setShowOriginPanel(false);
    setShowDestPanel(false);
  };

  const togglePreference = (id: TravelPreference) => {
    setSelectedPreferences((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleAccessibility = (id: string) => {
    setSelectedAccessibility((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // ─── AI Query Parse and Submit ──────────────────────────────────────────
  const handleAiPlan = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiParsing(true);
    
    try {
      const parsed = await parseQueryWithAI(aiPrompt);
      
      // Update form configurations
      if (parsed.from) {
        setOriginQuery(parsed.from);
        const res = await searchLocations(parsed.from);
        if (res.length > 0) selectOrigin(res[0]);
      }
      
      if (parsed.to) {
        setDestQuery(parsed.to);
        const res = await searchLocations(parsed.to);
        if (res.length > 0) selectDestination(res[0]);
      }

      if (parsed.budget) setBudget(parsed.budget);
      if (parsed.travellers) setTravellers(parsed.travellers);
      if (parsed.preferences && parsed.preferences.length > 0) {
        setSelectedPreferences(parsed.preferences);
      }
      if (parsed.safetyMode !== undefined) {
        setSafetyMode(parsed.safetyMode);
      }

      // Check accessibility matching
      const accessMapped = parsed.preferences.filter(p => ["wheelchair", "elderly", "family", "baby"].includes(p));
      setSelectedAccessibility(accessMapped);

      // Trigger routing search immediately after brief delay for visual feedback
      navTimerRef.current = setTimeout(() => {
        setIsSearching(true);
        const params = new URLSearchParams({
          from: parsed.from || "Kochi Airport",
          to: parsed.to || "Marine Drive",
          date: date || new Date().toISOString().split("T")[0],
          budget: (parsed.budget || budget).toString(),
          travellers: (parsed.travellers || travellers).toString(),
          preferences: (parsed.preferences || selectedPreferences).join(","),
          safety: (parsed.safetyMode || safetyMode).toString(),
          accessibility: accessMapped.join(",")
        });
        router.push(`/journey?${params.toString()}`);
      }, 1500);

    } catch (e) {
      console.error("AI parse failed:", e);
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSearch = () => {
    setIsSearching(true);
    const params = new URLSearchParams({
      from: originQuery || "Kochi Airport",
      to: destQuery || "Marine Drive",
      date: date || new Date().toISOString().split("T")[0],
      budget: budget.toString(),
      travellers: travellers.toString(),
      preferences: selectedPreferences.join(","),
      safety: safetyMode.toString(),
      accessibility: selectedAccessibility.join(",")
    });
    
    // Save to offline query caching
    if (typeof window !== "undefined") {
      const savedQuery = {
        from: originQuery || "Kochi Airport",
        to: destQuery || "Marine Drive",
        date: date || new Date().toISOString().split("T")[0],
        cost: budget,
        duration: 35,
        mode: "metro"
      };
      const prev = localStorage.getItem("flowroute_history");
      const list = prev ? JSON.parse(prev) : [];
      list.unshift(savedQuery);
      localStorage.setItem("flowroute_history", JSON.stringify(list.slice(0, 10)));
    }

    navTimerRef.current = setTimeout(() => {
      router.push(`/journey?${params.toString()}`);
    }, 1000);
  };

  const accessibilityOptions = [
    { id: "wheelchair", label: t("wheelchairUser", language), emoji: "♿" },
    { id: "elderly", label: t("elderlyLabel", language), emoji: "👵" },
    { id: "lowvision", label: t("lowVision", language), emoji: "👁️" },
    { id: "hearing", label: t("hearingImpaired", language), emoji: "👂" },
    { id: "pregnant", label: t("pregnant", language), emoji: "🤰" },
    { id: "child", label: t("childFriendly", language), emoji: "👶" },
  ];

  return (
    <div className="flex flex-grow flex-col lg:flex-row h-[calc(100vh-64px)] relative overflow-hidden bg-background">
      
      {/* ─── Left Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-full lg:w-[450px] bg-card border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col min-h-[60%] max-h-[65%] lg:min-h-0 lg:max-h-full lg:h-full z-10 overflow-y-auto">
        
        {/* Header Toggle */}
        <div className="p-4 border-b border-white/5 bg-black/20 flex gap-2">
          <button
            onClick={() => setPlannerMode("manual")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
              plannerMode === "manual"
                ? "bg-white/5 border-white/10 text-white shadow-md"
                : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            📋 {t("manualPlanner", language)}
          </button>
          <button
            onClick={() => setPlannerMode("ai")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
              plannerMode === "ai"
                ? "bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan shadow-lg shadow-brand-cyan/5"
                : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t("askAiAssistant", language)}
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5 overflow-y-auto pb-6">
          <AnimatePresence mode="wait">
            {plannerMode === "manual" ? (
              <motion.div
                key="manual-planner"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* ─── Location Inputs ─────────────────────────────────────── */}
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {t("routeParameters", language)}
                  </label>
                  <div className="relative">
                    <label htmlFor="origin-input" className="sr-only">Origin location</label>
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-cyan z-10" aria-hidden="true" />
                    <input
                      id="origin-input"
                      type="text"
                      aria-label={t("fromPlaceholder", language)}
                      aria-autocomplete="list"
                      aria-expanded={showOriginPanel && originSuggestions.length > 0}
                      aria-controls="origin-suggestions"
                      placeholder={t("fromPlaceholder", language)}
                      value={originQuery}
                      onChange={(e) => handleOriginChange(e.target.value)}
                      onFocus={() => setShowOriginPanel(true)}
                      className="w-full bg-black/40 border border-white/8 focus:border-brand-cyan/50 rounded-xl pl-11 pr-9 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors"
                    />
                    {originQuery && (
                      <button 
                        onClick={() => { setOriginQuery(""); setOrigin(null); }} 
                        aria-label={t("clearOrigin", language)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-white"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                    <AnimatePresence>
                      {showOriginPanel && (originSuggestions.length > 0 || originLoading) && (
                        <motion.div id="origin-suggestions" role="listbox" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 mt-1.5 p-2 rounded-xl bg-slate-900 border border-white/10 shadow-2xl z-30 max-h-52 overflow-y-auto">
                          {originLoading ? (
                            <div className="flex items-center justify-center py-3 gap-2 text-xs text-slate-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-cyan" /> Searching...
                            </div>
                          ) : originSuggestions.map((loc, i) => (
                            <button key={i} role="option" aria-selected={false} onClick={() => selectOrigin(loc)}
                              className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 text-xs text-slate-300 hover:text-white transition-colors">
                              <span className="font-semibold block">{loc.name}</span>
                              <span className="text-[10px] text-slate-500 truncate block">{loc.displayName}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Swap button */}
                  <div className="flex items-center justify-center">
                    <button onClick={swapLocations} aria-label={t("swapLocations", language)}
                      className="p-2 rounded-xl bg-white/5 border border-white/8 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 text-slate-500 hover:text-brand-cyan transition-all">
                      <ArrowRightLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="relative">
                    <label htmlFor="dest-input" className="sr-only">Destination location</label>
                    <Navigation className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-blue z-10" aria-hidden="true" />
                    <input
                      id="dest-input"
                      type="text"
                      aria-label={t("toPlaceholder", language)}
                      aria-autocomplete="list"
                      aria-expanded={showDestPanel && destSuggestions.length > 0}
                      aria-controls="dest-suggestions"
                      placeholder={t("toPlaceholder", language)}
                      value={destQuery}
                      onChange={(e) => handleDestChange(e.target.value)}
                      onFocus={() => setShowDestPanel(true)}
                      className="w-full bg-black/40 border border-white/8 focus:border-brand-blue/50 rounded-xl pl-11 pr-9 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors"
                    />
                    {destQuery && (
                      <button 
                        onClick={() => { setDestQuery(""); setDestination(null); }} 
                        aria-label={t("clearDestination", language)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-white"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                    <AnimatePresence>
                      {showDestPanel && (destSuggestions.length > 0 || destLoading) && (
                        <motion.div id="dest-suggestions" role="listbox" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 mt-1.5 p-2 rounded-xl bg-slate-900 border border-white/10 shadow-2xl z-30 max-h-52 overflow-y-auto">
                          {destLoading ? (
                            <div className="flex items-center justify-center py-3 gap-2 text-xs text-slate-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" /> Searching...
                            </div>
                          ) : destSuggestions.map((loc, i) => (
                            <button key={i} role="option" aria-selected={false} onClick={() => selectDestination(loc)}
                              className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 text-xs text-slate-300 hover:text-white transition-colors">
                              <span className="font-semibold block">{loc.name}</span>
                              <span className="text-[10px] text-slate-500 truncate block">{loc.displayName}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Date & Travellers */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                      {t("dateLabel", language)}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/8 focus:border-brand-cyan/40 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-300 outline-none transition-colors [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                      {t("travellersLabel", language)}
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <div className="flex items-center bg-black/40 border border-white/8 rounded-xl pl-10 pr-2 py-1">
                        <button onClick={() => setTravellers(Math.max(1, travellers - 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white font-bold transition-colors">-</button>
                        <span className="flex-1 text-center text-sm font-semibold text-white">{travellers}</span>
                        <button onClick={() => setTravellers(Math.min(10, travellers + 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white font-bold transition-colors">+</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Budget slider */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    {t("budgetLabel", language)}
                  </label>
                  <div className="relative bg-black/40 border border-white/8 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-white">₹{budget.toLocaleString("en-IN")}</span>
                      </div>
                      <span className="text-xs text-slate-500">{t("perPerson", language)}</span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={50000}
                      step={500}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="budget-slider w-full cursor-pointer"
                      style={{ '--slider-pct': `${((budget - 500) / (50000 - 500)) * 100}%` } as React.CSSProperties}
                    />
                  </div>
                </div>

                {/* Accessibility Options */}
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Accessibility className="w-3.5 h-3.5 text-brand-cyan" />
                    {t("accessibilityProfile", language)}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {accessibilityOptions.map((opt) => {
                      const isSelected = selectedAccessibility.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleAccessibility(opt.id)}
                          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 text-left ${
                            isSelected
                              ? "bg-brand-cyan/15 border-brand-cyan/40 text-brand-cyan"
                              : "bg-black/25 border-white/8 text-slate-400 hover:border-white/15"
                          }`}
                        >
                          <span className="text-base">{opt.emoji}</span>
                          <span className="leading-tight">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Women's Safety & Travel Style Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    🛡️ {t("womensSafety", language)}
                  </label>
                  <button
                    onClick={() => setSafetyMode(!safetyMode)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 text-left ${
                      safetyMode
                        ? "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 shadow-md"
                        : "bg-black/25 border-white/8 text-slate-400 hover:border-white/15"
                    }`}
                  >
                    <div className={`p-2 rounded-xl border ${safetyMode ? "bg-fuchsia-500/15 border-fuchsia-500/30" : "bg-white/5 border-white/10"}`}>
                      <Shield className={`w-4 h-4 ${safetyMode ? "text-fuchsia-400" : "text-slate-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold">{t("womensSafety", language)}</h4>
                      <p className="text-[9px] text-slate-500 leading-normal mt-0.5">
                        {language === "en" ? "Prioritize streetlights, crowded lanes, police & hospitals." : language === "hi" ? "सड़क की रोशनी, भीड़भाड़ वाले रास्ते, पुलिस और अस्पतालों को प्राथमिकता दें।" : "തെരുവ് വിളക്കുകൾ, തിരക്കേറിയ വഴികൾ, പോലീസ്, ആശുപത്രികൾ എന്നിവയ്ക്ക് മുൻഗണന നൽകുക."}
                      </p>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${safetyMode ? "bg-fuchsia-400 animate-ping" : "bg-transparent"}`} />
                  </button>
                </div>

                {/* Travel Preferences Selection */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    🏃 {t("travelStyle", language)}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {travelPreferences.map((pref) => {
                      const isSelected = selectedPreferences.includes(pref.id as TravelPreference);
                      return (
                        <button
                          key={pref.id}
                          onClick={() => togglePreference(pref.id as TravelPreference)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-semibold border transition-all ${
                            isSelected
                              ? "bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan"
                              : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10"
                          }`}
                        >
                          <span>{pref.emoji}</span>
                          <span>{pref.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Phase 1 — Trip Details Section */}
                <TripDetailsSection />

                {/* Search Button */}

                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-background bg-brand-cyan hover:bg-brand-cyan/90 hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("searching", language)}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t("findMyRoute", language)}
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="ai-planner"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                {/* AI Textarea */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    💬 {t("describeJourney", language)}
                  </label>
                  <div className="relative card rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                    <textarea
                      rows={5}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={
                        language === "en"
                          ? "Example: Take me from Kochi Airport to Marine Drive using the cheapest accessible route at night."
                          : language === "hi"
                          ? "उदाहरण: मुझे कोच्चि हवाई अड्डे से मरीन ड्राइव तक रात में सबसे सस्ते सुगम मार्ग से ले चलें।"
                          : "ഉദാഹരണം: കൊച്ചി എയർപോർട്ടിൽ നിന്ന് മറൈൻ ഡ്രൈവിലേക്ക് ഏറ്റവും കുറഞ്ഞ ചിലവിലുള്ള സുരക്ഷിതമായ വഴി കാണിക്കുക."
                      }
                      className="w-full bg-transparent p-4 text-sm text-slate-200 placeholder-slate-500 outline-none resize-none border-none focus:ring-0"
                    />
                    
                    {/* Voice Controls inside text area */}
                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                      {isListening ? (
                        <button
                          onClick={stopListening}
                          className="p-2.5 rounded-xl bg-red-600 border border-red-500/20 text-white animate-pulse"
                          title="Listening... Click to stop"
                        >
                          <MicOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => startListening(language)}
                          className="p-2.5 rounded-xl bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan hover:text-slate-950 transition-colors"
                          aria-label={t("voiceBtnTooltip", language)}
                          title={t("voiceBtnTooltip", language)}
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {isListening && (
                    <span role="status" aria-live="polite" className="text-[10px] text-brand-cyan animate-pulse px-1 block font-medium">
                      🎙️ {t("speakNow", language)}
                    </span>
                  )}
                </div>

                {/* Sparkles Prompt Box Help */}
                <div className="p-3.5 rounded-2xl bg-brand-cyan/5 border border-brand-cyan/10 text-[10px] text-slate-400 leading-normal flex gap-2.5">
                  <Sparkles className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">{t("aiCompanionTitle", language)}</span>
                    {t("aiCompanionDesc", language)}
                  </div>
                </div>

                {/* AI Action button */}
                <button
                  onClick={handleAiPlan}
                  disabled={isAiParsing || !aiPrompt.trim()}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-slate-950 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-cyan bg-[length:200%] animate-[gradient_4s_linear_infinite] hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isAiParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      {t("parsingQuery", language)}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t("letAiPlan", language)}
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ─── Map ─────────────────────────────────────────────────────────── */}
      <section className="flex-grow h-[45%] lg:h-full relative">
        <MapWrapper
          origin={origin}
          destination={destination}
          essentials={[]} // Loaded in planner pre-check
        />
      </section>
    </div>
  );
}
