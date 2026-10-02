/**
 * services/providers/demo-accommodation.ts
 *
 * Demo accommodation provider — returns realistic-looking hotel/hostel options
 * that match the AccommodationProvider interface shape.
 *
 * isDemoProvider: true — always surfaced in the UI with an "Estimated" disclaimer.
 * Does NOT import from lib/mockData.ts (different concern).
 */

import type {
  AccommodationProvider,
  ProviderCapabilities,
  HotelSearchParams,
  HotelResult,
  HotelDetails,
  AvailabilityResult,
} from "./base";
import { providerRegistry } from "./registry";

const CAPABILITIES: ProviderCapabilities = {
  auth: { type: "none" },
  rateLimit: { requestsPerMinute: 1000 },
  currency: ["INR", "USD", "EUR", "GBP"],
  bookingMode: "none",
  sandbox: true,
};

const CURRENCY_RATE: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
};

function convertPrice(amountInr: number, currency: string): { amount: number; currency: string } {
  const rate = CURRENCY_RATE[currency] ?? 1;
  return { amount: Math.round(amountInr * rate), currency };
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const DEMO_HOTELS: Array<{
  name: string;
  type: string;
  starRating: number;
  guestRating: number;
  pricePerNightInr: number;
  amenities: string[];
}> = [
  {
    name: "The Harbour View Hotel",
    type: "hotel",
    starRating: 4,
    guestRating: 4.2,
    pricePerNightInr: 3500,
    amenities: ["Free WiFi", "Swimming pool", "Restaurant", "AC"],
  },
  {
    name: "Backpacker's Paradise Hostel",
    type: "hostel",
    starRating: 2,
    guestRating: 4.6,
    pricePerNightInr: 600,
    amenities: ["Free WiFi", "Common kitchen", "Lockers", "Rooftop"],
  },
  {
    name: "Budget Comfort Inn",
    type: "hotel",
    starRating: 3,
    guestRating: 3.9,
    pricePerNightInr: 1800,
    amenities: ["Free WiFi", "AC", "24h reception"],
  },
  {
    name: "City Apartments",
    type: "apartment",
    starRating: 0,
    guestRating: 4.4,
    pricePerNightInr: 2200,
    amenities: ["Kitchen", "Washing machine", "Free WiFi", "Balcony"],
  },
];

const demoAccommodationProvider: AccommodationProvider = {
  id: "demo-accommodation",
  name: "Demo Accommodation (Estimated)",
  isDemoProvider: true,
  capabilities: CAPABILITIES,

  async search(params: HotelSearchParams): Promise<HotelResult[]> {
    const checkIn  = new Date(params.checkIn);
    const checkOut = new Date(params.checkOut);
    const nights   = Math.max(
      1,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    );

    let options = DEMO_HOTELS;

    // Filter by type preference if given
    if (params.type && params.type !== "flexible") {
      const filtered = options.filter((h) => h.type === params.type);
      if (filtered.length > 0) options = filtered;
    }

    return options.map((h) => ({
      id: makeId(),
      name: h.name,
      type: h.type,
      starRating: h.starRating || undefined,
      guestRating: h.guestRating,
      pricePerNight: convertPrice(h.pricePerNightInr * params.rooms, params.currency),
      totalPrice: convertPrice(h.pricePerNightInr * params.rooms * nights, params.currency),
      amenities: h.amenities,
      available: true,
      isDemoData: true,
    }));
  },

  async getDetails(id: string): Promise<HotelDetails> {
    return {
      id,
      name: "The Harbour View Hotel",
      type: "hotel",
      starRating: 4,
      guestRating: 4.2,
      pricePerNight: { amount: 3500, currency: "INR" },
      amenities: ["Free WiFi", "Swimming pool", "Restaurant", "AC"],
      available: true,
      isDemoData: true,
      description: "A comfortable hotel near the city centre with great views.",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      cancellationPolicy: "Free cancellation up to 48h before check-in",
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkAvailability(_id: string, _checkIn: Date, _checkOut: Date): Promise<AvailabilityResult> {
    return {
      available: true,
      seatsRemaining: 5,
      updatedAt: new Date().toISOString(),
    };
  },
};

// Auto-register
providerRegistry.registerAccommodation(demoAccommodationProvider);

export { demoAccommodationProvider };
