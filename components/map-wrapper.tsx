"use client";

import dynamic from "next/dynamic";
import { Location } from "@/types/planner";
import { Essential, FoodStop, Attraction } from "@/types/journey";

interface MapWrapperProps {
  origin: Location | null;
  destination: Location | null;
  routeGeometry?: [number, number][];
  foodPlaces?: FoodStop[];
  essentials?: Essential[];
  attractions?: Attraction[];
  safetyMode?: boolean;
  activeSegmentCoords?: [number, number][];
}

const DynamicMap = dynamic(() => import("./interactive-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-950/20 rounded-3xl border border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/5 via-brand-blue/5 to-transparent animate-pulse"></div>
      <div className="flex flex-col items-center gap-4 text-center z-10">
        <div className="w-10 h-10 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin"></div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Initializing Navigation Map</h4>
          <p className="text-xs text-slate-400 mt-1">Loading vector layers...</p>
        </div>
      </div>
    </div>
  ),
});

export default function MapWrapper({
  origin,
  destination,
  routeGeometry,
  foodPlaces,
  essentials,
  attractions,
  safetyMode,
  activeSegmentCoords
}: MapWrapperProps) {
  return (
    <DynamicMap
      origin={origin}
      destination={destination}
      routeGeometry={routeGeometry}
      foodPlaces={foodPlaces}
      essentials={essentials}
      attractions={attractions}
      safetyMode={safetyMode}
      activeSegmentCoords={activeSegmentCoords}
    />
  );
}
