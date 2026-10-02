"use client";

/**
 * app/explore/page.tsx
 * Discovery Mode map explorer — shows nearby places based on the selected discovery radius.
 */

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useDiscoveryMode, useSettingsActions, useTripData } from "@/hooks/useTripStore";
import type { DiscoveryMode } from "@/types/trip";

const MapWrapper = dynamic(() => import("@/components/map-wrapper"), { ssr: false });

const DISCOVERY_MODES: { value: DiscoveryMode; label: string; radius: number }[] = [
  { value: "off",       label: "Off",       radius: 0 },
  { value: "low",       label: "Low",       radius: 500 },
  { value: "balanced",  label: "Balanced",  radius: 1500 },
  { value: "active",    label: "Active",    radius: 3000 },
  { value: "adventure", label: "Adventure", radius: 8000 },
];

export default function ExplorePage() {
  const mode = useDiscoveryMode();
  const { setDiscoveryMode } = useSettingsActions();
  const trip = useTripData();

  // Set page title (client-side since this is a 'use client' page)
  useEffect(() => {
    document.title = "Explore | FlowRoute";
  }, []);

  const currentConfig = DISCOVERY_MODES.find((m) => m.value === mode) ?? DISCOVERY_MODES[2];

  return (
    <div className="relative w-full h-[calc(100vh-72px)] overflow-hidden">
      {/* Full-height map */}
      <MapWrapper />

      {/* Floating overlay panel */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-3 max-w-xs w-full pointer-events-auto">
        <div className="rounded-xl bg-background/90 backdrop-blur-sm border border-white/10 p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Discovery Mode</h2>
              <p className="text-xs text-foreground/50 mt-0.5">Explore nearby places</p>
            </div>
            {mode !== "off" && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                {currentConfig.radius}m radius
              </span>
            )}
          </div>

          {/* Mode selector */}
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Discovery mode">
            {DISCOVERY_MODES.map(({ value, label }) => (
              <button
                key={value}
                role="radio"
                aria-checked={mode === value}
                onClick={() => setDiscoveryMode(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px] ${
                  mode === value
                    ? "bg-primary text-black"
                    : "bg-white/10 text-foreground/70 hover:bg-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Description */}
          {mode !== "off" && (
            <p className="text-xs text-foreground/60 leading-relaxed">
              Showing places within {currentConfig.radius}m of your route. Start a trip to add
              discovered places to your itinerary.
            </p>
          )}

          {!trip && (
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-foreground/50 text-center">
              Start a trip to add discovered places to your itinerary.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
