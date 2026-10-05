"use client";

/**
 * app/explore/page.tsx
 *
 * Phase 8 — Explore Page Upgrade
 *
 * Replaces Leaflet placeholder with live MapLibre GL JS map.
 * Wires Discovery Mode radius → Overpass POI query.
 * Adds category filter chips (Food / Attractions / Essentials).
 * "Add to Trip" popup → useTripActions().updateTripField.
 */

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Utensils,
  Camera,
  CrossIcon,
  Loader2,
  MapPin,
  Wifi,
  WifiOff,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import {
  useDiscoveryMode,
  useSettingsActions,
  useTripData,
  useGeolocationConsent,
  useLanguage,
  useTripActions,
} from "@/hooks/useTripStore";
import type { DiscoveryMode } from "@/types/trip";
import type { POIData } from "@/components/map/ExploreMapInner";
import { fetchNearbyPlaces } from "@/services/overpass";

// Dynamic import — WebGL + maplibre-gl, no SSR
const ExploreMapInner = dynamic(
  () => import("@/components/map/ExploreMapInner"),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-900 animate-pulse" /> }
);

// ── Discovery mode config ─────────────────────────────────────────────────────
const DISCOVERY_MODES: {
  value: DiscoveryMode;
  label: string;
  labelHi: string;
  labelMl: string;
  radius: number;
}[] = [
  { value: "off",       label: "Off",       labelHi: "बंद",      labelMl: "ഓഫ്",       radius: 0 },
  { value: "low",       label: "Low",       labelHi: "कम",       labelMl: "കുറഞ്ഞ",      radius: 500 },
  { value: "balanced",  label: "Balanced",  labelHi: "संतुलित",  labelMl: "സന്തുലിതം", radius: 1500 },
  { value: "active",    label: "Active",    labelHi: "सक्रिय",  labelMl: "സജീവം",     radius: 3000 },
  { value: "adventure", label: "Adventure", labelHi: "साहसिक",  labelMl: "സാഹസിക",    radius: 8000 },
];

// ── Category filters ──────────────────────────────────────────────────────────
type POICategory = "food" | "attractions" | "essentials";

const CATEGORY_CONFIG: { key: POICategory; label: string; icon: React.ElementType; color: string }[] = [
  { key: "food",        label: "Food",        icon: Utensils,   color: "text-orange-400 border-orange-400/30 bg-orange-400/10" },
  { key: "attractions", label: "Sights",      icon: Camera,     color: "text-purple-400 border-purple-400/30 bg-purple-400/10" },
  { key: "essentials",  label: "Essentials",  icon: CrossIcon,  color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
];

export default function ExplorePage() {
  const mode = useDiscoveryMode();
  const { setDiscoveryMode } = useSettingsActions();
  const trip = useTripData();
  const consent = useGeolocationConsent();
  const language = useLanguage();
  const { updateTripField } = useTripActions();

  const [gpsCenter, setGpsCenter] = useState<[number, number] | null>(null);
  const [poiData, setPoiData] = useState<POIData>({ foodStops: [], essentials: [], attractions: [] });
  const [loading, setLoading] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<POICategory>>(
    new Set(["food", "attractions", "essentials"])
  );
  const [addedPOI, setAddedPOI] = useState<string | null>(null); // for success toast
  const [panelOpen, setPanelOpen] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // ── Page title ──────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = "Explore | FlowRoute";
  }, []);

  // ── GPS watch for center ────────────────────────────────────────────────────
  useEffect(() => {
    if (!consent || typeof navigator === "undefined" || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setGpsCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {
        // Use trip origin as fallback if GPS denied mid-session
        if (trip?.intent?.from) {
          // No geocoding here — just leave center as-is or null
        }
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 }
    );
    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consent]);

  // ── Fetch POIs when center or mode changes ──────────────────────────────────
  const currentMode = DISCOVERY_MODES.find((m) => m.value === mode) ?? DISCOVERY_MODES[2];

  const fetchPOIs = useCallback(async () => {
    if (!gpsCenter || currentMode.radius === 0) {
      setPoiData({ foodStops: [], essentials: [], attractions: [] });
      return;
    }

    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();
    setLoading(true);

    try {
      const result = await fetchNearbyPlaces(
        gpsCenter[0],
        gpsCenter[1],
        currentMode.radius,
        []
      );
      setPoiData(result);
    } catch {
      // Silent fail — old data stays
    } finally {
      setLoading(false);
    }
  }, [gpsCenter, currentMode.radius]);

  useEffect(() => {
    fetchPOIs();
  }, [fetchPOIs]);

  // ── Listen for "Add to Trip" CustomEvent from popup button ──────────────────
  useEffect(() => {
    const handler = (e: CustomEvent<{ name: string; lat: number; lng: number; category: string }>) => {
      const { name } = e.detail;
      // Append to trip preferences as a waypoint note (best effort — no dedicated waypoint field yet)
      updateTripField("preferences", [
        ...(trip?.intent?.preferences ?? []),
        `visit:${name}`,
      ]);
      setAddedPOI(name);
      setTimeout(() => setAddedPOI(null), 2500);
    };

    window.addEventListener("flowroute:add-poi", handler as EventListener);
    return () => window.removeEventListener("flowroute:add-poi", handler as EventListener);
  }, [updateTripField, trip?.intent?.preferences]);

  // ── Filtered POI data based on active category chips ───────────────────────
  const filteredPOIData: POIData = {
    foodStops:   activeCategories.has("food")        ? poiData.foodStops   : [],
    attractions: activeCategories.has("attractions") ? poiData.attractions  : [],
    essentials:  activeCategories.has("essentials")  ? poiData.essentials   : [],
  };

  const toggleCategory = (cat: POICategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };


  const getModeLabel = (m: typeof DISCOVERY_MODES[0]) => {
    if (language === "hi") return m.labelHi;
    if (language === "ml") return m.labelMl;
    return m.label;
  };

  const totalPOIs =
    filteredPOIData.foodStops.length +
    filteredPOIData.attractions.length +
    filteredPOIData.essentials.length;

  return (
    <div className="relative w-full h-[calc(100vh-72px)] overflow-hidden">
      {/* Full-viewport MapLibre map */}
      <ExploreMapInner
        center={gpsCenter}
        radiusMeters={currentMode.radius}
        poiData={filteredPOIData}
        onAddToTrip={(name, lat, lng, category) => {
          window.dispatchEvent(
            new CustomEvent("flowroute:add-poi", { detail: { name, lat, lng, category } })
          );
        }}
      />

      {/* ── Floating control panel ─────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 max-w-[280px] w-full pointer-events-auto">
        {/* Panel header toggle */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden"
        >
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-brand-cyan" />
              <span className="text-sm font-bold text-white">
                {language === "hi" ? "खोज मोड" : language === "ml" ? "കണ്ടെത്തൽ" : "Discovery"}
              </span>
              {loading && <Loader2 className="w-3.5 h-3.5 text-brand-cyan animate-spin" />}
              {!loading && totalPOIs > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20 font-bold">
                  {totalPOIs}
                </span>
              )}
            </div>
            <span className="text-slate-500 text-xs">{panelOpen ? "▲" : "▼"}</span>
          </button>

          <AnimatePresence>
            {panelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {/* Mode selector */}
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
                      {language === "hi" ? "खोज त्रिज्या" : language === "ml" ? "ദൂരം" : "Search Radius"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {DISCOVERY_MODES.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => setDiscoveryMode(m.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            mode === m.value
                              ? "bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40"
                              : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                          }`}
                          aria-pressed={mode === m.value}
                        >
                          {getModeLabel(m)}
                          {m.radius > 0 && (
                            <span className="ml-1 opacity-60">
                              {m.radius >= 1000 ? `${m.radius / 1000}km` : `${m.radius}m`}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category filter chips */}
                  {mode !== "off" && (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
                        {language === "hi" ? "श्रेणी" : language === "ml" ? "വിഭാഗം" : "Filter"}
                      </p>
                      <div className="flex gap-1.5">
                        {CATEGORY_CONFIG.map(({ key, label, icon: Icon, color }) => {
                          const count =
                            key === "food"
                              ? poiData.foodStops.length
                              : key === "attractions"
                              ? poiData.attractions.length
                              : poiData.essentials.length;

                          return (
                            <button
                              key={key}
                              onClick={() => toggleCategory(key)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all border ${
                                activeCategories.has(key)
                                  ? color
                                  : "bg-white/5 text-slate-600 border-white/5"
                              }`}
                              aria-pressed={activeCategories.has(key)}
                            >
                              <Icon className="w-3 h-3" />
                              {label}
                              {count > 0 && (
                                <span className="ml-0.5 opacity-70">{count}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* GPS / no-trip status */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {gpsCenter ? (
                      <>
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">GPS active</span>
                      </>
                    ) : consent ? (
                      <>
                        <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                        <span className="text-slate-400">Acquiring GPS...</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-500">
                          {language === "hi"
                            ? "स्थान अनुमति आवश्यक"
                            : language === "ml"
                            ? "ലൊക്കേഷൻ ആവശ്യം"
                            : "Enable location in Journey to explore"}
                        </span>
                      </>
                    )}
                  </div>

                  {/* No active trip hint */}
                  {!trip && mode !== "off" && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/5 border border-white/8">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {language === "hi"
                          ? "यात्रा प्रारंभ करें — खोजे गए स्थान आपकी यात्रा में जुड़ जाएंगे।"
                          : language === "ml"
                          ? "ഒരു യാത്ര ആരംഭിക്കൂ — കണ്ടെത്തിയ സ്ഥലങ്ങൾ ചേർക്കാം."
                          : "Start a trip — discovered places can be added to your itinerary."}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── "Added to Trip" toast ──────────────────────────────────────────── */}
      <AnimatePresence>
        {addedPOI && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm shadow-xl"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">
              {addedPOI} added to trip preferences
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
