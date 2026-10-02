/**
 * services/providers/base.ts
 *
 * Provider interface contracts for FlowRoute.
 * Demo implementations satisfy these interfaces; real providers (Phase 3) replace them.
 */

// ─── Capabilities ─────────────────────────────────────────────────────────────

export interface ProviderCapabilities {
  auth?: {
    type: "apiKey" | "oauth2" | "none";
    headerName?: string;
  };
  rateLimit: {
    requestsPerMinute: number;
    burstLimit?: number;
  };
  pagination?: {
    style: "offset" | "cursor" | "none";
    maxPageSize: number;
  };
  /** ISO 4217 currency codes this provider supports */
  currency: string[];
  /** Whether the provider can create bookings, or is read-only */
  bookingMode: "sync" | "async" | "none";
  /** ISO 3166-1 alpha-2 regions supported */
  regions?: string[];
  /** If true this is a sandbox/test environment */
  sandbox?: boolean;
}

// ─── Transport Provider ───────────────────────────────────────────────────────

export interface TransportSearchParams {
  from: string;
  to: string;
  departureDate: string;
  travellers: number;
  currency: string;
  preferences?: string[];
}

export interface TransportResult {
  id: string;
  mode: string;
  operator?: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops?: number;
  price: { amount: number; currency: string };
  carbonKg?: number;
  available: boolean;
  isDemoData: boolean;
}

export interface TransportDetails extends TransportResult {
  amenities?: string[];
  cancellationPolicy?: string;
  bookingUrl?: string;
}

export interface AvailabilityResult {
  available: boolean;
  seatsRemaining?: number;
  updatedAt: string;
}

export interface BookingParams {
  resultId: string;
  travellers: number;
  contactEmail?: string;
}

export interface BookingResult {
  bookingId: string;
  status: "confirmed" | "pending" | "failed";
  pnr?: string;
  totalAmount: { amount: number; currency: string };
  confirmationUrl?: string;
}

export interface TrackingResult {
  bookingId: string;
  status: "on_time" | "delayed" | "cancelled" | "departed" | "arrived";
  delayMinutes?: number;
  platform?: string;
}

export interface TransportProvider {
  readonly id: string;
  readonly name: string;
  readonly isDemoProvider: boolean;
  readonly capabilities: ProviderCapabilities;

  search(params: TransportSearchParams): Promise<TransportResult[]>;
  getDetails(id: string): Promise<TransportDetails>;
  checkAvailability(id: string, date: Date): Promise<AvailabilityResult>;
  createBooking?(params: BookingParams): Promise<BookingResult>;
  cancelBooking?(bookingId: string): Promise<void>;
  track?(bookingId: string): Promise<TrackingResult>;
}

// ─── Accommodation Provider ───────────────────────────────────────────────────

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  currency: string;
  type?: string; // "hotel" | "hostel" | "apartment" | "camping" | "flexible"
}

export interface HotelResult {
  id: string;
  name: string;
  type: string;
  starRating?: number;
  guestRating?: number;
  pricePerNight: { amount: number; currency: string };
  totalPrice?: { amount: number; currency: string };
  address?: string;
  amenities?: string[];
  available: boolean;
  isDemoData: boolean;
}

export interface HotelDetails extends HotelResult {
  description?: string;
  photos?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  bookingUrl?: string;
}

export interface AccommodationProvider {
  readonly id: string;
  readonly name: string;
  readonly isDemoProvider: boolean;
  readonly capabilities: ProviderCapabilities;

  search(params: HotelSearchParams): Promise<HotelResult[]>;
  getDetails(id: string): Promise<HotelDetails>;
  checkAvailability(id: string, checkIn: Date, checkOut: Date): Promise<AvailabilityResult>;
}

// ─── Places Provider ─────────────────────────────────────────────────────────

export interface Place {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance?: number;
  rating?: number;
  openNow?: boolean;
}

export interface PlaceDetails extends Place {
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string[];
  photos?: string[];
}

export interface PlacesProvider {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;

  searchNearby(
    lat: number,
    lng: number,
    radius: number,
    categories: string[]
  ): Promise<Place[]>;
  getDetails(id: string): Promise<PlaceDetails>;
}
