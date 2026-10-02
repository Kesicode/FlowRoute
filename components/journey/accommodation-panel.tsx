"use client";

/**
 * components/journey/accommodation-panel.tsx
 * Displays demo accommodation options. Always shows a prominent demo disclaimer.
 */

import { AlertTriangle, Star } from "lucide-react";
import { useTripIntent, useTripActions } from "@/hooks/useTripStore";
import type { AccommodationOption } from "@/types/trip";

const DEMO_OPTIONS: Omit<AccommodationOption, "id">[] = [
  {
    name: "The Harbour View Hotel",
    type: "hotel",
    pricePerNight: { amount: 3500, currency: "INR" },
    rating: 4.2,
    isDemoData: true,
  },
  {
    name: "Backpacker's Paradise Hostel",
    type: "hostel",
    pricePerNight: { amount: 600, currency: "INR" },
    rating: 4.6,
    isDemoData: true,
  },
  {
    name: "Budget Comfort Inn",
    type: "hotel",
    pricePerNight: { amount: 1800, currency: "INR" },
    rating: 3.9,
    isDemoData: true,
  },
];

const TYPE_LABELS: Record<string, string> = {
  hotel: "Hotel",
  hostel: "Hostel",
  apartment: "Apartment",
  camping: "Camping",
  flexible: "Flexible",
};

export function AccommodationPanel() {
  const intent = useTripIntent();
  const { setAccommodation } = useTripActions();

  const currency = intent?.currency ?? "INR";

  return (
    <div className="flex flex-col gap-3">
      {/* Demo notice — always visible */}
      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
        <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
        <span className="text-xs text-amber-300">
          Demo data — prices are estimates only. Not real availability.
        </span>
      </div>

      {/* Options */}
      {DEMO_OPTIONS.map((opt, idx) => {
        const option: AccommodationOption = { ...opt, id: `demo-acc-${idx}` };
        return (
          <div
            key={option.id}
            className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-start justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-foreground truncate">{option.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-foreground/60 flex-shrink-0">
                  {TYPE_LABELS[option.type] ?? option.type}
                </span>
              </div>
              {option.rating && (
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <Star size={10} fill="currentColor" aria-hidden="true" />
                  <span>{option.rating.toFixed(1)}</span>
                </div>
              )}
              <div className="mt-1 flex items-baseline gap-1 text-sm">
                <span className="font-semibold text-primary">
                  {currency} {option.pricePerNight.amount.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-foreground/50">/ night est.</span>
              </div>
            </div>

            <button
              onClick={() => setAccommodation(option)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors min-h-[44px] min-w-[44px]"
              aria-label={`Select ${option.name}`}
            >
              Select
            </button>
          </div>
        );
      })}
    </div>
  );
}
