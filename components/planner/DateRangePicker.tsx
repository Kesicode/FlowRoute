"use client";

/**
 * components/planner/DateRangePicker.tsx
 * Departure + optional return date picker connected to the trip store.
 *
 * NOTE: When adding translations, add keys to services/translations.ts:
 *   departure_date: "Departure Date" | "प्रस्थान तिथि" | "പുറപ്പെടൽ തീയതി"
 *   return_date:    "Return Date"    | "वापसी तिथि"    | "മടങ്ങൽ തീയതി"
 */

import { useTripIntent, useTripActions } from "@/hooks/useTripStore";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(isoDate: string | undefined, days: number): string {
  const base = isoDate ? new Date(isoDate) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().split("T")[0];
}

export function DateRangePicker({ className = "" }: { className?: string }) {
  const intent = useTripIntent();
  const { updateTripField } = useTripActions();

  const today = todayISO();
  const departure = intent?.departureDate ?? "";
  const returnMin = departure ? addDays(departure, 1) : addDays(today, 1);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Departure */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
          Departure Date
        </span>
        <input
          type="date"
          min={today}
          value={departure}
          onChange={(e) => updateTripField("departureDate", e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors min-h-[44px]"
          aria-label="Departure date"
        />
      </label>

      {/* Return (optional) */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
          Return Date <span className="text-foreground/30 normal-case">(optional)</span>
        </span>
        <input
          type="date"
          min={returnMin}
          value={intent?.returnDate ?? ""}
          onChange={(e) => updateTripField("returnDate", e.target.value || undefined)}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors min-h-[44px]"
          aria-label="Return date (optional)"
        />
      </label>
    </div>
  );
}
