"use client";

/**
 * components/planner/AccommodationPrefsSelector.tsx
 * Tile-style selector for accommodation preference type.
 */

import { Building2, Tent, Home, Trees, Shuffle } from "lucide-react";
import { useTripIntent, useTripActions } from "@/hooks/useTripStore";
import type { AccommodationPreference } from "@/types/trip";

const OPTIONS: { value: AccommodationPreference; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { value: "hotel",     label: "Hotel",     Icon: Building2 },
  { value: "hostel",    label: "Hostel",    Icon: Tent },
  { value: "apartment", label: "Apartment", Icon: Home },
  { value: "camping",   label: "Camping",   Icon: Trees },
  { value: "flexible",  label: "Flexible",  Icon: Shuffle },
];

export function AccommodationPrefsSelector({ className = "" }: { className?: string }) {
  const intent = useTripIntent();
  const { updateTripField } = useTripActions();

  const selected = intent?.accommodationPreference ?? "flexible";

  return (
    <div className={`grid grid-cols-3 gap-2 sm:grid-cols-5 ${className}`} role="radiogroup" aria-label="Accommodation preference">
      {OPTIONS.map(({ value, label, Icon }) => {
        const isSelected = selected === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={isSelected}
            onClick={() => updateTripField("accommodationPreference", value)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-sm min-h-[80px] ${
              isSelected
                ? "bg-primary/10 border-primary text-primary"
                : "bg-white/5 border-white/10 text-foreground/60 hover:bg-white/10 hover:text-foreground"
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
