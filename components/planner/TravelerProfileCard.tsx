"use client";

/**
 * components/planner/TravelerProfileCard.tsx
 * Pill-button selector for traveler profile type.
 */

import { User, Users, Baby, Accessibility, PersonStanding } from "lucide-react";
import { useTravelerProfile, useSettingsActions } from "@/hooks/useTripStore";
import type { TravelerProfile } from "@/types/trip";

const PROFILES: { value: TravelerProfile; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { value: "solo",       label: "Solo",       Icon: User },
  { value: "couple",     label: "Couple",     Icon: Users },
  { value: "family",     label: "Family",     Icon: Baby },
  { value: "elderly",    label: "Elderly",    Icon: PersonStanding },
  { value: "accessible", label: "Accessible", Icon: Accessibility },
];

export function TravelerProfileCard() {
  const profile = useTravelerProfile();
  const { setTravelerProfile } = useSettingsActions();

  const handleSelect = (value: TravelerProfile) => {
    setTravelerProfile(value);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-a11y", value === "accessible" ? "true" : "false");
    }
  };

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Traveler profile">
      {PROFILES.map(({ value, label, Icon }) => {
        const selected = profile === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={selected}
            onClick={() => handleSelect(value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] min-w-[44px] ${
              selected
                ? "bg-primary/10 border border-primary text-primary"
                : "bg-white/5 border border-white/10 text-foreground/70 hover:bg-white/10 hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
