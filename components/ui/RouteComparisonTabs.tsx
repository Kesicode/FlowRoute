"use client";

/**
 * components/ui/RouteComparisonTabs.tsx
 * Shows Fastest | Cheapest | Eco | Comfortable tabs with scores from route-scorer.
 */

import { useState } from "react";
import { Zap, DollarSign, Leaf, Armchair } from "lucide-react";
import { scoreRoute, type RouteInput } from "@/lib/route-scorer";
import type { OptimizationMode } from "@/types/trip";

const DEMO_ROUTE: RouteInput = {
  durationMinutes: 300,
  distanceKm: 500,
  cost: 4000,
  carbonKg: 40,
  walkingKm: 1,
  transfers: 1,
  weatherSeverity: 0,
  accessible: true,
  scenic: false,
};

const TABS: { mode: OptimizationMode; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { mode: "fastest",    label: "Fastest",   Icon: Zap },
  { mode: "cheapest",   label: "Cheapest",  Icon: DollarSign },
  { mode: "eco",        label: "Eco",       Icon: Leaf },
  { mode: "comfortable",label: "Comfort",   Icon: Armchair },
];

export function RouteComparisonTabs() {
  const [active, setActive] = useState<OptimizationMode>("fastest");
  const score = scoreRoute(DEMO_ROUTE, active);

  const circumference = 2 * Math.PI * 28; // radius 28
  const dash = (score.total / 100) * circumference;

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1">
        {TABS.map(({ mode, label, Icon }) => (
          <button
            key={mode}
            onClick={() => setActive(mode)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              active === mode
                ? "bg-primary text-black"
                : "text-foreground/60 hover:text-foreground hover:bg-white/10"
            }`}
            aria-pressed={active === mode}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Score ring + recommendation */}
      <div className="flex items-center gap-4">
        <svg width="72" height="72" viewBox="0 0 72 72" aria-label={`Score: ${score.total} out of 100`}>
          <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle
            cx="36" cy="36" r="28"
            fill="none"
            stroke="hsl(180 100% 50%)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform="rotate(-90 36 36)"
          />
          <text x="36" y="40" textAnchor="middle" className="text-sm font-bold" fill="currentColor" fontSize="14">
            {score.total}
          </text>
        </svg>

        <div className="flex-1">
          <p className="text-sm text-foreground/80">{score.recommendation}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(score.breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs text-foreground/50">
                <span className="capitalize">{key}</span>
                <span className="font-mono">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
