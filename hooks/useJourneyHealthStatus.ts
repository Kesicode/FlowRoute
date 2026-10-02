"use client";

/**
 * hooks/useJourneyHealthStatus.ts
 *
 * Derives a rich JourneyHealth status object from the current store state.
 * Returns display-ready label, color class, and icon name alongside the raw health value.
 */

import { useJourneyHealth, useDeviationDetected, useTripStatus } from "@/hooks/useTripStore";
import type { JourneyHealth } from "@/types/trip";

export interface JourneyHealthStatus {
  health: JourneyHealth;
  label: string;
  colorClass: string;  // Tailwind class for the badge background
  textClass: string;   // Tailwind class for the badge text
  pulse: boolean;      // Whether the badge should animate/pulse
}

const HEALTH_MAP: Record<JourneyHealth, Omit<JourneyHealthStatus, "health">> = {
  on_track:        { label: "On Track",        colorClass: "bg-emerald-500/20", textClass: "text-emerald-400", pulse: false },
  at_risk:         { label: "At Risk",          colorClass: "bg-amber-500/20",   textClass: "text-amber-400",   pulse: true  },
  delayed:         { label: "Delayed",          colorClass: "bg-orange-500/20",  textClass: "text-orange-400",  pulse: true  },
  action_required: { label: "Action Required",  colorClass: "bg-red-500/20",     textClass: "text-red-400",     pulse: true  },
  completed:       { label: "Completed",        colorClass: "bg-blue-500/20",    textClass: "text-blue-400",    pulse: false },
};

export function useJourneyHealthStatus(): JourneyHealthStatus {
  const health = useJourneyHealth();
  const deviation = useDeviationDetected();
  const tripStatus = useTripStatus();

  // If trip completed, override health display
  const effectiveHealth: JourneyHealth =
    tripStatus === "completed" ? "completed" : deviation && health === "on_track" ? "at_risk" : health;

  return {
    health: effectiveHealth,
    ...HEALTH_MAP[effectiveHealth],
  };
}
