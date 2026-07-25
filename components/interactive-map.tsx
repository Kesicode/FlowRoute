"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Location } from "@/types/planner";
import { Essential, FoodStop, Attraction } from "@/types/journey";
import { Hospital, ShieldAlert, Banknote, Fuel, Utensils, Landmark } from "lucide-react";

interface InteractiveMapProps {
  origin: Location | null;
  destination: Location | null;
  routeGeometry?: [number, number][];
  foodPlaces?: FoodStop[];
  essentials?: Essential[];
  attractions?: Attraction[];
  safetyMode?: boolean;
  activeSegmentCoords?: [number, number][];
}

// Custom Leaflet Icons using L.divIcon with glowing Tailwind animations
const createCustomIcon = (bgClass: string, pingBgClass: string, glowColor: string, symbol: string) => {
  return L.divIcon({
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
};

const createPOIIcon = (bgClass: string, symbol: string, glowColor: string) => {
  return L.divIcon({
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
};

const originIcon = createCustomIcon("bg-brand-cyan text-slate-950", "bg-brand-cyan/20", "rgba(0,242,254,0.6)", "A");
const destIcon = createCustomIcon("bg-brand-blue", "bg-brand-blue/20", "rgba(79,172,254,0.6)", "B");

// Map controller to adjust view dynamically
function MapController({
  origin,
  destination,
  routeGeometry,
  activeSegmentCoords
}: {
  origin: [number, number] | null;
  destination: [number, number] | null;
  routeGeometry?: [number, number][];
  activeSegmentCoords?: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (activeSegmentCoords && activeSegmentCoords.length > 0) {
      map.fitBounds(activeSegmentCoords, {
        padding: [80, 80],
        maxZoom: 16,
        animate: true,
        duration: 0.8,
      });
    } else if (routeGeometry && routeGeometry.length > 0) {
      map.fitBounds(routeGeometry, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
        duration: 1.2,
      });
    } else if (origin && destination) {
      map.fitBounds([origin, destination], {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
        duration: 1.2,
      });
    } else if (origin) {
      map.setView(origin, 14, {
        animate: true,
        duration: 1.0,
      });
    } else if (destination) {
      map.setView(destination, 14, {
        animate: true,
        duration: 1.0,
      });
    }
  }, [origin, destination, routeGeometry, activeSegmentCoords, map]);

  return null;
}

export default function InteractiveMap({
  origin,
  destination,
  routeGeometry,
  foodPlaces = [],
  essentials = [],
  attractions = [],
  safetyMode = false,
  activeSegmentCoords = []
}: InteractiveMapProps) {
  
  // Layer toggles
  const [showHospitals, setShowHospitals] = useState(true);
  const [showPolice, setShowPolice] = useState(true);
  const [showATMs, setShowATMs] = useState(true);
  const [showChargers, setShowChargers] = useState(true);
  const [showFood, setShowFood] = useState(true);
  const [showAttractions, setShowAttractions] = useState(true);

  // Default coordinates centered on Kochi
  const defaultCenter: [number, number] = [9.9312, 76.2673];
  const defaultZoom = 13;

  const originCoords: [number, number] | null = origin ? [origin.lat, origin.lng] : null;
  const destCoords: [number, number] | null = destination ? [destination.lat, destination.lng] : null;

  // Filter essentials
  const hospitals = essentials.filter(e => e.type === "hospital" && !e.name.toLowerCase().includes("police"));
  const policeStations = essentials.filter(e => e.type === "hospital" && e.name.toLowerCase().includes("police"));
  const atms = essentials.filter(e => e.type === "atm");
  const chargers = essentials.filter(e => e.type === "fuel");

  return (
    <div className="w-full h-full min-h-[400px] rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative flex flex-col">
      
      {/* Floating Control Panel for POI toggles */}
      <div className="absolute top-4 right-4 z-[45] glass-panel p-3 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-2 max-w-xs text-xs">
        <span className="font-bold text-white uppercase tracking-wider text-[10px] mb-1 opacity-70 block">
          Map Layers & Amenities
        </span>
        
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <button
            onClick={() => setShowHospitals(!showHospitals)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${
              showHospitals ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" : "bg-black/20 border-white/5 text-slate-500"
            }`}
          >
            <Hospital className="w-3.5 h-3.5" />
            <span>Hospitals</span>
          </button>

          <button
            onClick={() => setShowPolice(!showPolice)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${
              showPolice ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold" : "bg-black/20 border-white/5 text-slate-500"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Police</span>
          </button>

          <button
            onClick={() => setShowATMs(!showATMs)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${
              showATMs ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 font-bold" : "bg-black/20 border-white/5 text-slate-500"
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>ATMs</span>
          </button>

          <button
            onClick={() => setShowChargers(!showChargers)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${
              showChargers ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" : "bg-black/20 border-white/5 text-slate-500"
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>EV Chargers</span>
          </button>

          <button
            onClick={() => setShowFood(!showFood)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${
              showFood ? "bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold" : "bg-black/20 border-white/5 text-slate-500"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Food stops</span>
          </button>

          <button
            onClick={() => setShowAttractions(!showAttractions)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${
              showAttractions ? "bg-purple-500/10 border-purple-500/30 text-purple-400 font-bold" : "bg-black/20 border-white/5 text-slate-500"
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Sights</span>
          </button>
        </div>

        {safetyMode && (
          <div className="mt-1 pt-1.5 border-t border-white/5 text-[9px] text-fuchsia-400 font-bold flex items-center gap-1 animate-pulse">
            🛡️ Women&apos;s Safety Mode Active: Safe pathways prioritized
          </div>
        )}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={false}
        className="w-full h-full flex-1"
        style={{ background: "#05070a" }}
      >
        {/* Dark theme tile layers from CartoDB */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        {/* Origin Marker */}
        {originCoords && (
          <Marker position={originCoords} icon={originIcon}>
            <Popup className="custom-popup">
              <div className="p-2 text-xs font-semibold text-slate-800">
                <span className="text-brand-cyan uppercase block text-[9px] font-bold">Origin</span>
                {origin?.name}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destCoords && (
          <Marker position={destCoords} icon={destIcon}>
            <Popup className="custom-popup">
              <div className="p-2 text-xs font-semibold text-slate-800">
                <span className="text-brand-blue uppercase block text-[9px] font-bold">Destination</span>
                {destination?.name}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dynamic POI Hospital Markers */}
        {showHospitals && hospitals.map((hosp) => (
          <Marker key={hosp.id} position={hosp.coordinate} icon={createPOIIcon("bg-red-500", "🏥", "rgba(239,68,68,0.7)")}>
            <Popup className="custom-popup">
              <div className="p-2 text-xs font-semibold text-slate-800">
                <span className="text-red-500 uppercase block text-[9px] font-bold">Hospital</span>
                {hosp.name}
                <span className="block mt-0.5 text-[9px] font-normal text-slate-500">{hosp.address}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Dynamic POI Police Station Markers */}
        {showPolice && policeStations.map((pol) => (
          <Marker key={pol.id} position={pol.coordinate} icon={createPOIIcon("bg-indigo-600", "👮", "rgba(79,70,229,0.7)")}>
            <Popup className="custom-popup">
              <div className="p-2 text-xs font-semibold text-slate-800">
                <span className="text-indigo-600 uppercase block text-[9px] font-bold">Police Station</span>
                {pol.name}
                <span className="block mt-0.5 text-[9px] font-normal text-slate-500">Security checkpoint</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Dynamic POI ATM Markers */}
        {showATMs && atms.map((atm) => (
          <Marker key={atm.id} position={atm.coordinate} icon={createPOIIcon("bg-yellow-500", "🏧", "rgba(234,179,8,0.7)")}>
            <Popup className="custom-popup">
              <div className="p-2 text-xs font-semibold text-slate-800">
                <span className="text-yellow-600 uppercase block text-[9px] font-bold">ATM Cashpoint</span>
                {atm.name}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Dynamic POI EV Chargers Markers */}
        {showChargers && chargers.map((chg) => (
          <Marker key={chg.id} position={chg.coordinate} icon={createPOIIcon("bg-emerald-500", "🔌", "rgba(16,185,129,0.7)")}>
            <Popup className="custom-popup">
              <div className="p-2 text-xs font-semibold text-slate-800">
                <span className="text-emerald-500 uppercase block text-[9px] font-bold">EV Charger</span>
                {chg.name}
                <span className="block mt-0.5 text-[9px] font-normal text-slate-500">Fast charging point</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Dynamic POI Food Stops Markers */}
        {showFood && (foodPlaces.length > 0 ? foodPlaces : foodPlaces).map((food) => (
          <Marker key={food.id} position={food.coordinate} icon={createPOIIcon("bg-orange-500", "🍽️", "rgba(249,115,22,0.7)")}>
            <Popup className="custom-popup">
              <div className="p-2 text-xs font-semibold text-slate-800">
                <span className="text-orange-500 uppercase block text-[9px] font-bold">{food.cuisine}</span>
                {food.name}
                <span className="block text-[10px] text-slate-500 mt-1">⭐ {food.rating} · Price: {food.priceRange}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Dynamic POI Attractions Markers */}
        {showAttractions && attractions.map((attr) => (
          <Marker key={attr.id} position={attr.coordinate} icon={createPOIIcon("bg-purple-500", attr.emoji || "📸", "rgba(168,85,247,0.7)")}>
            <Popup className="custom-popup">
              <div className="p-2 text-xs font-semibold text-slate-800">
                <span className="text-purple-500 uppercase block text-[9px] font-bold">{attr.category}</span>
                {attr.name}
                <span className="block text-[10px] text-slate-500 mt-0.5">{attr.description}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Connecting route polyline (OSRM or straight line) */}
        {routeGeometry && routeGeometry.length > 0 ? (
          <>
            {/* Background solid route line */}
            <Polyline
              positions={routeGeometry}
              pathOptions={{
                color: safetyMode ? "#d946ef" : "#00F2FE", // Magenta in safety mode, Cyan otherwise
                weight: 5,
                opacity: 0.35,
              }}
            />
            {/* Foreground animated dashed line */}
            <Polyline
              positions={routeGeometry}
              pathOptions={{
                color: safetyMode ? "#f472b6" : "#4FACFE",
                weight: 4,
                opacity: 0.95,
                dashArray: "12, 16",
                className: "animated-polyline"
              }}
            />
          </>
        ) : originCoords && destCoords ? (
          <Polyline
            positions={[originCoords, destCoords]}
            pathOptions={{
              color: safetyMode ? "#d946ef" : "#00F2FE",
              weight: 3,
              dashArray: "6, 8",
              opacity: 0.8,
            }}
          />
        ) : null}

        {/* Highlighted active segment polyline */}
        {activeSegmentCoords && activeSegmentCoords.length > 0 && (
          <>
            <Polyline
              positions={activeSegmentCoords}
              pathOptions={{
                color: "#ffc107", // Glowing Gold
                weight: 8,
                opacity: 0.5,
              }}
            />
            <Polyline
              positions={activeSegmentCoords}
              pathOptions={{
                color: "#fff",
                weight: 4,
                opacity: 0.95,
                dashArray: "4, 6",
                className: "animated-polyline"
              }}
            />
          </>
        )}

        {/* Map state synchronizer */}
        <MapController
          origin={originCoords}
          destination={destCoords}
          routeGeometry={routeGeometry}
          activeSegmentCoords={activeSegmentCoords}
        />
      </MapContainer>
    </div>
  );
}
