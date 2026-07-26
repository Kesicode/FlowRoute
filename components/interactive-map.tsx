"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Location } from "@/types/planner";
import { Essential, FoodStop, Attraction, JourneyRoute } from "@/types/journey";
import { Hospital, ShieldAlert, Banknote, Fuel, Utensils, Landmark } from "lucide-react";

interface InteractiveMapProps {
  origin: Location | null;
  destination: Location | null;
  routeGeometry?: [number, number][];
  foodPlaces?: FoodStop[];
  essentials?: Essential[];
  attractions?: Attraction[]
  safetyMode?: boolean;
  activeSegmentCoords?: [number, number][];
  selectedRoute?: JourneyRoute | null;
  allRoutes?: JourneyRoute[];
}

// ─── Custom Div Icons ─────────────────────────────────────────────────────────
const createCustomIcon = (bgClass: string, pingBgClass: string, glowColor: string, symbol: string) =>
  L.divIcon({
    className: "custom-div-icon",
    html: `
      <div class="relative w-8 h-8 flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <div class="absolute w-7 h-7 rounded-full ${pingBgClass} animate-ping"></div>
        <div class="w-5 h-5 rounded-full ${bgClass} border border-slate-950 flex items-center justify-center shadow-[0_0_12px_${glowColor}] text-[10px] font-bold text-white">
          ${symbol}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const createPOIIcon = (bgClass: string, symbol: string, glowColor: string) =>
  L.divIcon({
    className: "custom-div-icon",
    html: `
      <div class="relative w-6 h-6 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform duration-200">
        <div class="w-5 h-5 rounded-full ${bgClass} border border-slate-950 flex items-center justify-center shadow-[0_0_8px_${glowColor}] text-[9px] text-white">
          ${symbol}
        </div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

const createETAIcon = (label: string, color: string) =>
  L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="background:${color};border:2px solid rgba(255,255,255,0.2);border-radius:8px;padding:3px 8px;font-size:10px;font-weight:700;color:#fff;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.5);backdrop-filter:blur(4px);">
        ${label}
      </div>
    `,
    iconSize: [80, 28],
    iconAnchor: [40, 14],
  });

const originIcon = createCustomIcon("bg-brand-cyan text-slate-950", "bg-brand-cyan/20", "rgba(0,242,254,0.6)", "A");
const destIcon   = createCustomIcon("bg-brand-blue",                "bg-brand-blue/20",  "rgba(79,172,254,0.6)", "B");

const userLocationIcon = L.divIcon({
  className: "custom-div-icon",
  html: `
    <div style="position:relative; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
      <div style="position:absolute; width:20px; height:20px; border-radius:50%; background-color:rgba(0,242,254,0.4);" class="animate-ping"></div>
      <div style="z-index:10; width:14px; height:14px; border-radius:50%; background-color:#00F2FE; border:2px solid white; box-shadow:0 0 12px rgba(0,242,254,0.9);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// ─── Route colour palette ─────────────────────────────────────────────────────
const ROUTE_COLORS = ["#00F2FE", "#4FACFE", "#a855f7", "#34d399", "#fbbf24"];
const ROUTE_COLORS_DIM = ["rgba(0,242,254,0.25)", "rgba(79,172,254,0.25)", "rgba(168,85,247,0.25)", "rgba(52,211,153,0.25)", "rgba(251,191,36,0.25)"];

// ─── Map controller: fitBounds whenever selectedRoute or geometry changes ─────
function MapController({
  origin,
  destination,
  routeGeometry,
  activeSegmentCoords,
  selectedRoute,
}: {
  origin: [number, number] | null;
  destination: [number, number] | null;
  routeGeometry?: [number, number][];
  activeSegmentCoords?: [number, number][];
  selectedRoute?: JourneyRoute | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Priority 1: fitBounds to selected route's full geometry
    if (selectedRoute) {
      const allCoords: [number, number][] = selectedRoute.segments.flatMap(
        (seg) => (seg.coordinates ?? []) as [number, number][]
      );
      if (allCoords.length > 1) {
        map.fitBounds(allCoords, { padding: [60, 60], maxZoom: 15, animate: true, duration: 0.7 });
        return;
      }
    }

    // Priority 2: active segment hover
    if (activeSegmentCoords && activeSegmentCoords.length > 0) {
      map.fitBounds(activeSegmentCoords, { padding: [80, 80], maxZoom: 16, animate: true, duration: 0.6 });
      return;
    }

    // Priority 3: full route geometry
    if (routeGeometry && routeGeometry.length > 0) {
      map.fitBounds(routeGeometry, { padding: [60, 60], maxZoom: 15, animate: true, duration: 0.8 });
      return;
    }

    // Fallback: origin + destination bounds
    if (origin && destination) {
      map.fitBounds([origin, destination], { padding: [60, 60], maxZoom: 15, animate: true, duration: 0.8 });
    } else if (origin) {
      map.setView(origin, 14, { animate: true, duration: 0.8 });
    } else if (destination) {
      map.setView(destination, 14, { animate: true, duration: 0.8 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute, activeSegmentCoords, origin, destination, routeGeometry]);

  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InteractiveMap({
  origin,
  destination,
  routeGeometry,
  foodPlaces = [],
  essentials = [],
  attractions = [],
  safetyMode = false,
  activeSegmentCoords = [],
  selectedRoute = null,
  allRoutes = [],
}: InteractiveMapProps) {

  const [showHospitals,   setShowHospitals]   = useState(true);
  const [showPolice,      setShowPolice]       = useState(true); // theme-aware state
  const [showATMs,        setShowATMs]         = useState(true);
  const [showChargers,    setShowChargers]     = useState(true);
  const [showFood,        setShowFood]         = useState(true);
  const [showAttractions, setShowAttractions]  = useState(true);
  const [isDarkMode,      setIsDarkMode]       = useState(true);
  const [mapInstance,     setMapInstance]      = useState<L.Map | null>(null);
  const [isLocating,      setIsLocating]       = useState(false);
  const [userLocation,    setUserLocation]     = useState<[number, number] | null>(null);

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const defaultCenter: [number, number] = [9.9312, 76.2673];
  const defaultZoom = 13;

  const originCoords: [number, number] | null = origin ? [origin.lat, origin.lng] : null;
  const destCoords:   [number, number] | null = destination ? [destination.lat, destination.lng] : null;

  const hospitals      = essentials.filter(e => e.type === "hospital" && !e.name.toLowerCase().includes("police"));
  const policeStations = essentials.filter(e => e.type === "hospital" &&  e.name.toLowerCase().includes("police"));
  const atms           = essentials.filter(e => e.type === "atm");
  const chargers       = essentials.filter(e => e.type === "fuel");

  // Midpoint of selected route for ETA label
  const selectedCoords = selectedRoute
    ? (selectedRoute.segments.flatMap(s => (s.coordinates ?? []) as [number, number][]))
    : (routeGeometry ?? []);

  const midPoint: [number, number] | null = selectedCoords.length > 1
    ? selectedCoords[Math.floor(selectedCoords.length / 2)]
    : null;

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstance) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        mapInstance.flyTo([latitude, longitude], 15, { animate: true, duration: 1.5 });
      },
      (err) => {
        setIsLocating(false);
        console.error("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: "#05070a" }}>

      {/* ── Floating Layer Control Panel ── */}
      <div className="absolute top-4 right-4 z-[450] bg-slate-950/85 backdrop-blur-lg p-3 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-2 max-w-[200px]">
        <span className="font-bold text-white uppercase tracking-wider text-[10px] opacity-70 block">
          Map Layers
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          {[
            { label: "Hospitals",    active: showHospitals,   toggle: () => setShowHospitals(!showHospitals),     color: "red",     icon: <Hospital className="w-3 h-3" /> },
            { label: "Police",       active: showPolice,      toggle: () => setShowPolice(!showPolice),           color: "indigo",  icon: <ShieldAlert className="w-3 h-3" /> },
            { label: "ATMs",         active: showATMs,        toggle: () => setShowATMs(!showATMs),               color: "yellow",  icon: <Banknote className="w-3 h-3" /> },
            { label: "Chargers",     active: showChargers,    toggle: () => setShowChargers(!showChargers),       color: "emerald", icon: <Fuel className="w-3 h-3" /> },
            { label: "Food",         active: showFood,        toggle: () => setShowFood(!showFood),               color: "orange",  icon: <Utensils className="w-3 h-3" /> },
            { label: "Sights",       active: showAttractions, toggle: () => setShowAttractions(!showAttractions), color: "purple",  icon: <Landmark className="w-3 h-3" /> },
          ].map(({ label, active, toggle, color, icon }) => (
            <button
              key={label}
              onClick={toggle}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all ${
                active
                  ? `bg-${color}-500/10 border-${color}-500/30 text-${color}-400 font-bold`
                  : "bg-black/20 border-white/5 text-slate-500"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {safetyMode && (
          <div className="pt-1.5 border-t border-white/5 text-[9px] text-fuchsia-400 font-bold flex items-center gap-1 animate-pulse">
            🛡️ Safety Mode Active
          </div>
        )}
      </div>

      {/* ── Route Legend Overlay (bottom left) ── */}
      {allRoutes.length > 0 && (
        <div className="absolute bottom-24 left-4 z-[450] card p-3 rounded-2xl border border-white/10 shadow-2xl space-y-1.5 max-w-[200px]">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider opacity-70 block mb-1">Routes</span>
          {allRoutes.map((route, i) => (
            <div key={route.id} className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full" style={{ background: ROUTE_COLORS[i % ROUTE_COLORS.length] }} />
              <span className={`text-[10px] font-semibold truncate ${selectedRoute?.id === route.id ? "text-white" : "text-slate-400"}`}>
                {route.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── ETA Floating Badge (midpoint of selected route) ── */}
      {selectedRoute && midPoint && (
        <div
          className="absolute z-[449] pointer-events-none"
          style={{
            // Approximate pixel placement; actual position handled by Leaflet Marker
          }}
        />
      )}

      {/* ── Locate Me Button (bottom left, next to layers control) ── */}
      <button
        onClick={handleLocateMe}
        disabled={isLocating}
        title="Locate Me"
        className="absolute bottom-[10px] left-[56px] z-[450] flex items-center justify-center w-[36px] h-[36px] bg-slate-950/85 backdrop-blur-lg border border-white/10 rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-white hover:bg-slate-900 transition-colors disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLocating ? "animate-spin text-brand-cyan" : ""}>
          <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
        </svg>
      </button>

      <MapContainer
        ref={setMapInstance}
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={true}
        minZoom={3}
        maxBounds={[[-90, -1000], [90, 1000]]}
        maxBoundsViscosity={1.0}
        className="w-full h-full"
        style={{ background: isDarkMode ? "#05070a" : "#f8fafc" }}
      >
        <LayersControl position="bottomleft">
          <LayersControl.BaseLayer checked name="Satellite">
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Default (Streets)">
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* ── User Location Marker ── */}
        {userLocation && (
          <Marker key={`user-loc-${userLocation[0]}-${userLocation[1]}`} position={userLocation} icon={userLocationIcon}>
            <Popup className="custom-popup" closeButton={false}>
              <div className="font-sans text-[11px] font-bold text-slate-800 text-center">You are here</div>
            </Popup>
          </Marker>
        )}

        {/* ── All route polylines (dim) ── */}
        {allRoutes.map((route, i) => {
          const coords: [number, number][] = route.segments.flatMap(
            s => (s.coordinates ?? []) as [number, number][]
          );
          if (coords.length < 2) return null;
          const isSelected = selectedRoute?.id === route.id;
          const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
          const dimColor = ROUTE_COLORS_DIM[i % ROUTE_COLORS_DIM.length];
          return (
            <Polyline
              key={route.id}
              positions={coords}
              pathOptions={{
                color: isSelected ? color : dimColor,
                weight: isSelected ? 6 : 3,
                opacity: isSelected ? 1 : 0.5,
                dashArray: isSelected ? undefined : "6 10",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          );
        })}

        {/* Animated dashes on selected route */}
        {selectedRoute && (() => {
          const coords: [number, number][] = selectedRoute.segments.flatMap(
            s => (s.coordinates ?? []) as [number, number][]
          );
          const i = allRoutes.findIndex(r => r.id === selectedRoute.id);
          const color = ROUTE_COLORS[i >= 0 ? i % ROUTE_COLORS.length : 0];
          return coords.length > 1 ? (
            <Polyline
              positions={coords}
              pathOptions={{
                color,
                weight: 4,
                opacity: 0.9,
                dashArray: "12 16",
                className: "animated-polyline",
              }}
            />
          ) : null;
        })()}

        {/* ETA midpoint marker for selected route */}
        {selectedRoute && midPoint && (
          <Marker
            position={midPoint}
            icon={createETAIcon(
              `⏱ ${selectedRoute.totalTime} min · ₹${selectedRoute.totalFare}`,
              safetyMode ? "#9333ea" : "#0e7490"
            )}
          />
        )}

        {/* Fallback polyline when no allRoutes */}
        {allRoutes.length === 0 && routeGeometry && routeGeometry.length > 0 && (
          <>
            <Polyline
              positions={routeGeometry}
              pathOptions={{
                color: safetyMode ? "#d946ef" : "#00F2FE",
                weight: 5,
                opacity: 0.35,
              }}
            />
            <Polyline
              positions={routeGeometry}
              pathOptions={{
                color: safetyMode ? "#f472b6" : "#4FACFE",
                weight: 4,
                opacity: 0.95,
                dashArray: "12, 16",
                className: "animated-polyline",
              }}
            />
          </>
        )}

        {/* Straight-line fallback */}
        {allRoutes.length === 0 && (!routeGeometry || routeGeometry.length === 0) && originCoords && destCoords && (
          <Polyline
            positions={[originCoords, destCoords]}
            pathOptions={{
              color: safetyMode ? "#d946ef" : "#00F2FE",
              weight: 3,
              dashArray: "6, 8",
              opacity: 0.8,
            }}
          />
        )}

        {/* Active segment highlight */}
        {activeSegmentCoords && activeSegmentCoords.length > 0 && (
          <>
            <Polyline positions={activeSegmentCoords} pathOptions={{ color: "#ffc107", weight: 10, opacity: 0.35 }} />
            <Polyline
              positions={activeSegmentCoords}
              pathOptions={{ color: "#fff", weight: 4, opacity: 0.95, dashArray: "4, 6", className: "animated-polyline" }}
            />
          </>
        )}

        {/* Origin Marker */}
        {originCoords && (
          <Marker position={originCoords} icon={originIcon}>
            <Popup>
              <div className="p-2 text-xs font-semibold">
                <span className="text-brand-cyan uppercase block text-[9px] font-bold">Origin</span>
                {origin?.name}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destCoords && (
          <Marker position={destCoords} icon={destIcon}>
            <Popup>
              <div className="p-2 text-xs font-semibold">
                <span className="text-brand-blue uppercase block text-[9px] font-bold">Destination</span>
                {destination?.name}
              </div>
            </Popup>
          </Marker>
        )}

        {/* POI Markers */}
        {showHospitals && hospitals.map(h => (
          <Marker key={h.id} position={h.coordinate} icon={createPOIIcon("bg-red-500", "🏥", "rgba(239,68,68,0.7)")}>
            <Popup><div className="p-2 text-xs"><span className="text-red-500 uppercase block text-[9px] font-bold">Hospital</span>{h.name}<span className="block mt-0.5 text-[9px] text-slate-500">{h.address}</span></div></Popup>
          </Marker>
        ))}
        {showPolice && policeStations.map(p => (
          <Marker key={p.id} position={p.coordinate} icon={createPOIIcon("bg-indigo-600", "👮", "rgba(79,70,229,0.7)")}>
            <Popup><div className="p-2 text-xs"><span className="text-indigo-600 uppercase block text-[9px] font-bold">Police Station</span>{p.name}</div></Popup>
          </Marker>
        ))}
        {showATMs && atms.map(a => (
          <Marker key={a.id} position={a.coordinate} icon={createPOIIcon("bg-yellow-500", "🏧", "rgba(234,179,8,0.7)")}>
            <Popup><div className="p-2 text-xs"><span className="text-yellow-600 uppercase block text-[9px] font-bold">ATM</span>{a.name}</div></Popup>
          </Marker>
        ))}
        {showChargers && chargers.map(c => (
          <Marker key={c.id} position={c.coordinate} icon={createPOIIcon("bg-emerald-500", "🔌", "rgba(16,185,129,0.7)")}>
            <Popup><div className="p-2 text-xs"><span className="text-emerald-500 uppercase block text-[9px] font-bold">EV Charger</span>{c.name}</div></Popup>
          </Marker>
        ))}
        {showFood && foodPlaces.map(f => (
          <Marker key={f.id} position={f.coordinate} icon={createPOIIcon("bg-orange-500", "🍽️", "rgba(249,115,22,0.7)")}>
            <Popup><div className="p-2 text-xs"><span className="text-orange-500 uppercase block text-[9px] font-bold">{f.cuisine}</span>{f.name}<span className="block text-[10px] text-slate-500 mt-1">⭐ {f.rating} · {f.priceRange}</span></div></Popup>
          </Marker>
        ))}
        {showAttractions && attractions.map(a => (
          <Marker key={a.id} position={a.coordinate} icon={createPOIIcon("bg-purple-500", a.emoji || "📸", "rgba(168,85,247,0.7)")}>
            <Popup><div className="p-2 text-xs"><span className="text-purple-500 uppercase block text-[9px] font-bold">{a.category}</span>{a.name}<span className="block text-[10px] text-slate-500 mt-0.5">{a.description}</span></div></Popup>
          </Marker>
        ))}

        {/* Map state synchronizer */}
        <MapController
          origin={originCoords}
          destination={destCoords}
          routeGeometry={routeGeometry}
          activeSegmentCoords={activeSegmentCoords}
          selectedRoute={selectedRoute}
        />
      </MapContainer>
    </div>
  );
}
