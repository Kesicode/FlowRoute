"use client";

/**
 * components/journey/accommodation-panel.tsx
 *
 * Phase 3 upgrade: Each demo hotel now has real booking deep-links
 * to Booking.com, Agoda, Airbnb, and MakeMyTrip with pre-filled dates
 * and guest counts.
 *
 * CurrencyDisplay shows prices in the user's preferred currency with
 * live FX conversion and a rate tooltip.
 *
 * Demo disclaimer is always visible — these are not real availability results.
 */

import { useState } from "react";
import { AlertTriangle, Star, ExternalLink } from "lucide-react";
import { useTripIntent, useTripActions, useCurrency } from "@/hooks/useTripStore";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { BookingButton } from "@/components/ui/BookingButton";
import { getHotelBookingLinks } from "@/services/booking-engine";
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
  const currency = useCurrency();
  const { setAccommodation } = useTripActions();

  // Track which card has its booking links open
  const [openLinks, setOpenLinks] = useState<string | null>(null);

  // Build hotel booking params from trip intent
  const hotelCity = intent?.to ?? "";
  const checkIn   = intent?.departureDate ?? new Date().toISOString().slice(0, 10);
  // Check-out defaults to check-in + 1 day if no return date
  const checkOut  = intent?.returnDate
    ?? (() => {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })();
  const guests = intent?.travellers ?? 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Demo notice — always visible */}
      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
        <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
        <span className="text-xs text-amber-300">
          Demo data — prices are estimates only. Use the booking links below for real availability.
        </span>
      </div>

      {/* Options */}
      {DEMO_OPTIONS.map((opt, idx) => {
        const option: AccommodationOption = { ...opt, id: `demo-acc-${idx}` };
        const bookingLinks = hotelCity
          ? getHotelBookingLinks({ city: hotelCity, checkIn, checkOut, guests })
          : [];
        const isOpen = openLinks === option.id;

        return (
          <div
            key={option.id}
            className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-2"
          >
            {/* Top row: info + select */}
            <div className="flex items-start justify-between gap-3">
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
                <div className="mt-1 flex items-baseline gap-1 text-sm flex-wrap">
                  {/* Phase 3: CurrencyDisplay with live FX conversion */}
                  <CurrencyDisplay
                    amount={option.pricePerNight.amount}
                    fromCurrency={option.pricePerNight.currency}
                    toCurrency={currency}
                    className="font-semibold text-primary"
                  />
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

            {/* Phase 3 — Hotel Booking Links */}
            {bookingLinks.length > 0 && (
              <div>
                <button
                  onClick={() => setOpenLinks(isOpen ? null : option.id)}
                  className="inline-flex items-center gap-1.5 text-xs text-brand-cyan/80 hover:text-brand-cyan transition-colors"
                  aria-expanded={isOpen}
                >
                  <ExternalLink className="w-3 h-3" />
                  {isOpen ? "Hide booking options" : "Book on a real platform →"}
                </button>

                {isOpen && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {bookingLinks.map((link) => (
                      <BookingButton key={link.platform} link={link} size="sm" />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
