"use client";

/**
 * components/ui/JourneyHealthBadge.tsx
 * Displays the current journey health status as an animated pill badge.
 */

import { useReducedMotion } from "framer-motion";
import { useJourneyHealthStatus } from "@/hooks/useJourneyHealthStatus";

export function JourneyHealthBadge({ className = "" }: { className?: string }) {
  const { label, colorClass, textClass, pulse } = useJourneyHealthStatus();
  const prefersReduced = useReducedMotion();
  const shouldPulse = pulse && !prefersReduced;

  return (
    <span
      role="status"
      aria-label={`Journey health: ${label}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClass} ${textClass} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full bg-current ${shouldPulse ? "animate-pulse" : ""}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
