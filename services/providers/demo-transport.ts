/**
 * services/providers/demo-transport.ts
 *
 * Demo transport provider — returns realistic-looking structured data
 * that matches the TransportProvider interface shape.
 *
 * isDemoProvider: true — always surfaced in the UI with an "Estimated" disclaimer.
 * Does NOT import from lib/mockData.ts (different concern — see implementation plan §11).
 */

import type {
  TransportProvider,
  ProviderCapabilities,
  TransportSearchParams,
  TransportResult,
  TransportDetails,
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

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function addMinutes(isoDate: string, minutes: number): string {
  const d = new Date(isoDate);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

const DEMO_OPTIONS: Array<{
  mode: string;
  operator: string;
  durationMinutes: number;
  priceInr: number;
  carbonKg: number;
  stops: number;
}> = [
  { mode: "train",    operator: "Indian Railways", durationMinutes: 480, priceInr: 800,  carbonKg: 18, stops: 3 },
  { mode: "bus",      operator: "KSRTC",           durationMinutes: 600, priceInr: 400,  carbonKg: 22, stops: 6 },
  { mode: "airplane", operator: "IndiGo",          durationMinutes: 90,  priceInr: 4500, carbonKg: 90, stops: 0 },
  { mode: "train",    operator: "Vande Bharat",    durationMinutes: 360, priceInr: 1500, carbonKg: 15, stops: 2 },
];

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

const demoTransportProvider: TransportProvider = {
  id: "demo-transport",
  name: "Demo Transport (Estimated)",
  isDemoProvider: true,
  capabilities: CAPABILITIES,

  async search(params: TransportSearchParams): Promise<TransportResult[]> {
    const depTime = params.departureDate
      ? `${params.departureDate}T07:00:00.000Z`
      : new Date().toISOString();

    return DEMO_OPTIONS.map((opt) => ({
      id: makeId(),
      mode: opt.mode,
      operator: opt.operator,
      departureTime: depTime,
      arrivalTime: addMinutes(depTime, opt.durationMinutes),
      durationMinutes: opt.durationMinutes,
      stops: opt.stops,
      price: convertPrice(opt.priceInr * params.travellers, params.currency),
      carbonKg: opt.carbonKg * params.travellers,
      available: true,
      isDemoData: true,
    }));
  },

  async getDetails(id: string): Promise<TransportDetails> {
    return {
      id,
      mode: "train",
      operator: "Indian Railways",
      departureTime: new Date().toISOString(),
      arrivalTime: addMinutes(new Date().toISOString(), 480),
      durationMinutes: 480,
      price: { amount: 800, currency: "INR" },
      carbonKg: 18,
      available: true,
      isDemoData: true,
      amenities: ["Pantry car", "AC sleeper"],
      cancellationPolicy: "Free cancellation up to 24h before departure",
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkAvailability(_id: string, _date: Date): Promise<AvailabilityResult> {
    return {
      available: true,
      seatsRemaining: 42,
      updatedAt: new Date().toISOString(),
    };
  },
};

// Auto-register
providerRegistry.registerTransport(demoTransportProvider);

export { demoTransportProvider };
