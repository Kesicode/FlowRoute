/**
 * services/booking-engine.ts
 *
 * Phase 3 — Booking Deep-Link Orchestrator
 *
 * Generates platform-specific booking URLs from structured trip segment data.
 * All functions are pure — no side effects, no network calls.
 * Returns URLs as strings; the UI decides whether to open them as deep-links
 * (mobile: window.location.href) or new tabs (desktop: window.open).
 *
 * Safety: All user-facing strings are encoded with encodeURIComponent().
 *         No API keys required — these are all public URL-scheme deep-links.
 */

// ─── Shared Param Types ────────────────────────────────────────────────────────

export interface TrainSegmentParams {
  from: string;          // Station name or city (e.g. "Kochi", "Ernakulam Junction")
  to: string;            // Destination station name or city
  date: string;          // ISO date string "YYYY-MM-DD"
  passengers?: number;   // Default 1
  classCode?: "SL" | "3A" | "2A" | "1A" | "CC" | "2S"; // IRCTC class
}

export interface FlightSegmentParams {
  from: string;          // City or IATA code (e.g. "COK", "Kochi")
  to: string;            // City or IATA code
  date: string;          // ISO date string "YYYY-MM-DD"
  returnDate?: string;   // For round-trip
  passengers?: number;
  tripType?: "one-way" | "round-trip";
}

export interface BusSegmentParams {
  from: string;
  to: string;
  date: string;          // ISO date string "YYYY-MM-DD"
  passengers?: number;
}

export interface CabSegmentParams {
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  originName: string;
  destName: string;
}

export interface HotelSearchParams {
  city: string;
  checkIn: string;       // ISO date "YYYY-MM-DD"
  checkOut: string;      // ISO date "YYYY-MM-DD"
  guests?: number;
  rooms?: number;
  preferredType?: "hotel" | "hostel" | "apartment" | "flexible";
}

// ─── Booking Link Result ───────────────────────────────────────────────────────

export interface BookingLink {
  platform: string;
  label: string;
  url: string;
  /**
   * "deeplink" — try as mobile intent URL first (window.location.href),
   *              fall back to web if app not installed.
   * "web"      — always open as a browser tab.
   */
  openMode: "deeplink" | "web";
  /** Whether this link opens inside the app ecosystem (true) or external (false) */
  isExternal: boolean;
  /** Platform logo emoji for quick visual identification */
  emoji: string;
}

// ─── Train Booking ─────────────────────────────────────────────────────────────

/**
 * Returns train booking deep-links for Indian Railways context.
 * IRCTC uses a web form; ConfirmTkt uses mobile-friendly URLs.
 */
export function getTrainBookingLinks(params: TrainSegmentParams): BookingLink[] {
  const { from, to, date, passengers = 1, classCode = "SL" } = params;
  const d = date.replace(/-/g, "");   // YYYYMMDD format for IRCTC
  const fromEnc = encodeURIComponent(from);
  const toEnc = encodeURIComponent(to);

  return [
    {
      platform: "IRCTC",
      label: "Book on IRCTC",
      url: `https://www.irctc.co.in/nget/train-search?from=${fromEnc}&to=${toEnc}&date=${d}&journeyClass=${classCode}&pax=${passengers}`,
      openMode: "web",
      isExternal: true,
      emoji: "🚆",
    },
    {
      platform: "ConfirmTkt",
      label: "ConfirmTkt",
      url: `https://confirmtkt.com/train-between-stations?from=${fromEnc}&to=${toEnc}&date=${date}&class=${classCode}`,
      openMode: "web",
      isExternal: true,
      emoji: "🎫",
    },
    {
      platform: "MakeMyTrip",
      label: "MakeMyTrip Trains",
      url: `https://www.makemytrip.com/railways/search?from=${fromEnc}&to=${toEnc}&departDate=${date}&class=${classCode}&passCount=${passengers}`,
      openMode: "web",
      isExternal: true,
      emoji: "🌐",
    },
  ];
}

// ─── Flight Booking ───────────────────────────────────────────────────────────

/**
 * Returns flight search deep-links across aggregators.
 * Uses standard query parameters that all major aggregators support.
 */
export function getFlightBookingLinks(params: FlightSegmentParams): BookingLink[] {
  const {
    from,
    to,
    date,
    returnDate,
    passengers = 1,
    tripType = returnDate ? "round-trip" : "one-way",
  } = params;

  const fromEnc = encodeURIComponent(from);
  const toEnc = encodeURIComponent(to);
  const isRoundTrip = tripType === "round-trip" && !!returnDate;

  // Google Flights
  const gfQuery = encodeURIComponent(
    `Flights from ${from} to ${to} on ${date}${isRoundTrip ? ` returning ${returnDate}` : ""}`
  );

  return [
    {
      platform: "Google Flights",
      label: "Google Flights",
      url: `https://www.google.com/travel/flights?q=${gfQuery}&curr=INR`,
      openMode: "web",
      isExternal: true,
      emoji: "✈️",
    },
    {
      platform: "Skyscanner",
      label: "Skyscanner",
      url: `https://www.skyscanner.net/transport/flights/${fromEnc.toLowerCase().slice(0, 3)}/${toEnc.toLowerCase().slice(0, 3)}/${date.replace(/-/g, "").slice(2)}/${isRoundTrip && returnDate ? returnDate.replace(/-/g, "").slice(2) + "/" : ""}?adults=${passengers}`,
      openMode: "web",
      isExternal: true,
      emoji: "🌍",
    },
    {
      platform: "MakeMyTrip",
      label: "MakeMyTrip Flights",
      url: `https://www.makemytrip.com/flights/${isRoundTrip ? "roundtrip" : "oneway"}-${fromEnc.toLowerCase()}-${toEnc.toLowerCase()}/${date}${isRoundTrip && returnDate ? `/${returnDate}` : ""}/1-0-0/F`,
      openMode: "web",
      isExternal: true,
      emoji: "🌐",
    },
    {
      platform: "EaseMyTrip",
      label: "EaseMyTrip",
      url: `https://www.easemytrip.com/flights/search?org=${fromEnc}&des=${toEnc}&dd=${date}&ad=1&ch=0&inf=0&cid=0&tt=${isRoundTrip ? "2" : "1"}`,
      openMode: "web",
      isExternal: true,
      emoji: "🛫",
    },
  ];
}

// ─── Bus Booking ──────────────────────────────────────────────────────────────

/**
 * Returns bus booking deep-links for Indian intercity routes.
 */
export function getBusBookingLinks(params: BusSegmentParams): BookingLink[] {
  const { from, to, date, passengers = 1 } = params;
  const fromEnc = encodeURIComponent(from);
  const toEnc = encodeURIComponent(to);
  const dateForRedBus = date; // YYYY-MM-DD works for RedBus

  return [
    {
      platform: "RedBus",
      label: "Book on RedBus",
      url: `https://www.redbus.in/bus-tickets/${fromEnc.toLowerCase().replace(/%20/g, "-")}-to-${toEnc.toLowerCase().replace(/%20/g, "-")}?doj=${dateForRedBus}&src=${fromEnc}&dst=${toEnc}&srcId=0&dstId=0&passCount=${passengers}`,
      openMode: "web",
      isExternal: true,
      emoji: "🚌",
    },
    {
      platform: "AbhiBus",
      label: "AbhiBus",
      url: `https://www.abhibus.com/bus-tickets-online/${fromEnc.toLowerCase().replace(/%20/g, "-")}-to-${toEnc.toLowerCase().replace(/%20/g, "-")}?doj=${date}&pax=${passengers}`,
      openMode: "web",
      isExternal: true,
      emoji: "🚎",
    },
    {
      platform: "MakeMyTrip",
      label: "MakeMyTrip Bus",
      url: `https://www.makemytrip.com/bus-tickets/${fromEnc.toLowerCase().replace(/%20/g, "-")}-to-${toEnc.toLowerCase().replace(/%20/g, "-")}/${date}`,
      openMode: "web",
      isExternal: true,
      emoji: "🌐",
    },
  ];
}

// ─── Cab / Rideshare Booking ──────────────────────────────────────────────────

/**
 * Returns cab intent links for Uber and Ola.
 * Uses coordinate-based deep-links when lat/lng are available,
 * falls back to text-search links when coordinates are unknown.
 */
export function getCabBookingLinks(params: CabSegmentParams): BookingLink[] {
  const { originLat, originLng, destLat, destLng, originName, destName } = params;

  const links: BookingLink[] = [];

  // Uber deep-link (works on iOS / Android; falls back gracefully on web)
  if (originLat && originLng && destLat && destLng) {
    links.push({
      platform: "Uber",
      label: "Book Uber",
      url: `uber://?action=setPickup&pickup[latitude]=${originLat}&pickup[longitude]=${originLng}&pickup[nickname]=${encodeURIComponent(originName)}&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
      openMode: "deeplink",
      isExternal: true,
      emoji: "🚗",
    });
  }

  // Uber web fallback
  links.push({
    platform: "Uber Web",
    label: "Uber (Web)",
    url: `https://m.uber.com/looking?pickup_nickname=${encodeURIComponent(originName)}&drop_nickname=${encodeURIComponent(destName)}${originLat ? `&pickup_lat=${originLat}&pickup_lng=${originLng}` : ""}${destLat ? `&drop_lat=${destLat}&drop_lng=${destLng}` : ""}`,
    openMode: "web",
    isExternal: true,
    emoji: "🚗",
  });

  // Ola (India-specific)
  links.push({
    platform: "Ola",
    label: "Book Ola",
    url: `https://book.olacabs.com/?serviceType=p2p&pickup_name=${encodeURIComponent(originName)}&drop_name=${encodeURIComponent(destName)}${originLat ? `&lat=${originLat}&lng=${originLng}` : ""}`,
    openMode: "web",
    isExternal: true,
    emoji: "🟡",
  });

  // Rapido (auto/bike taxis in India)
  links.push({
    platform: "Rapido",
    label: "Rapido",
    url: `https://www.rapido.bike/`,
    openMode: "web",
    isExternal: true,
    emoji: "⚡",
  });

  return links;
}

// ─── Hotel Booking ────────────────────────────────────────────────────────────

/**
 * Returns hotel search links for the specified city and dates.
 * Encodes check-in/out dates and guest count into platform-specific query formats.
 */
export function getHotelBookingLinks(params: HotelSearchParams): BookingLink[] {
  const { city, checkIn, checkOut, guests = 1, rooms = 1 } = params;
  const cityEnc = encodeURIComponent(city);

  // Booking.com uses ss (search string) and checkin/checkout as query params
  const bookingCheckIn = checkIn; // YYYY-MM-DD
  const bookingCheckOut = checkOut;

  return [
    {
      platform: "Booking.com",
      label: "Booking.com",
      url: `https://www.booking.com/searchresults.html?ss=${cityEnc}&checkin=${bookingCheckIn}&checkout=${bookingCheckOut}&group_adults=${guests}&no_rooms=${rooms}&selected_currency=INR`,
      openMode: "web",
      isExternal: true,
      emoji: "🏨",
    },
    {
      platform: "Agoda",
      label: "Agoda",
      url: `https://www.agoda.com/search?city=${cityEnc}&checkIn=${checkIn}&checkOut=${checkOut}&rooms=${rooms}&adults=${guests}`,
      openMode: "web",
      isExternal: true,
      emoji: "🌟",
    },
    {
      platform: "Airbnb",
      label: "Airbnb",
      url: `https://www.airbnb.com/s/${cityEnc}/homes?checkin=${checkIn}&checkout=${checkOut}&adults=${guests}`,
      openMode: "web",
      isExternal: true,
      emoji: "🏠",
    },
    {
      platform: "MakeMyTrip Hotels",
      label: "MakeMyTrip Hotels",
      url: `https://www.makemytrip.com/hotels/hotel-listing/?checkin=${checkIn.replace(/-/g, "")}&checkout=${checkOut.replace(/-/g, "")}&city=${cityEnc}&roomCount=${rooms}&adultCount=${guests}`,
      openMode: "web",
      isExternal: true,
      emoji: "🌐",
    },
    {
      platform: "Goibibo",
      label: "Goibibo",
      url: `https://www.goibibo.com/hotels/hotels-in-${cityEnc.toLowerCase().replace(/%20/g, "-")}/?checkin=${checkIn.replace(/-/g, "")}&checkout=${checkOut.replace(/-/g, "")}&adults=${guests}&children=0&rooms=${rooms}`,
      openMode: "web",
      isExternal: true,
      emoji: "🏩",
    },
  ];
}

// ─── Segment Auto-Classifier ──────────────────────────────────────────────────

export type SegmentTransportMode = "train" | "flight" | "bus" | "cab" | "unknown";

/**
 * Attempts to infer the transport mode from an itinerary segment's
 * activity/description text so the UI can show relevant booking links
 * without requiring the AI to explicitly tag each segment.
 */
export function classifySegmentMode(activity: string, description: string): SegmentTransportMode {
  const text = `${activity} ${description}`.toLowerCase();
  if (/train|rail|express|superfast|irctc|rajdhani|shatabdi|duronto/.test(text)) return "train";
  // Check cab BEFORE flight — "uber to airport" should be cab, not flight
  if (/\bcab\b|taxi|uber|ola\b|rapido|auto rickshaw/.test(text)) return "cab";
  // Flight requires an airline/flight-specific term, not just "airport"
  if (/\bflight\b|\bfly\b|airline|airways|air india|indigo|spicejet|vistara|aeropuerto/.test(text)) return "flight";
  if (/bus|ksrtc|state transport|sleeper bus|volvo|redbus/.test(text)) return "bus";
  return "unknown";
}


// ─── Universal Booking Link Builder ──────────────────────────────────────────

export interface UniversalSegmentParams {
  activity: string;
  description: string;
  location: string;
  type: "travel" | "attraction" | "food" | "rest" | "safety" | string;
  /** Trip-level context */
  tripFrom: string;
  tripTo: string;
  tripDate: string;         // ISO date
  tripReturnDate?: string;
  tripPassengers: number;
  tripCurrency: string;
}

/**
 * Returns the most relevant set of booking links for a given itinerary segment.
 * Combines mode inference with trip-level context.
 */
export function getSegmentBookingLinks(params: UniversalSegmentParams): BookingLink[] {
  if (params.type !== "travel") return [];

  const mode = classifySegmentMode(params.activity, params.description);

  switch (mode) {
    case "train":
      return getTrainBookingLinks({
        from: params.tripFrom,
        to: params.tripTo,
        date: params.tripDate,
        passengers: params.tripPassengers,
      });

    case "flight":
      return getFlightBookingLinks({
        from: params.tripFrom,
        to: params.tripTo,
        date: params.tripDate,
        returnDate: params.tripReturnDate,
        passengers: params.tripPassengers,
      });

    case "bus":
      return getBusBookingLinks({
        from: params.tripFrom,
        to: params.tripTo,
        date: params.tripDate,
        passengers: params.tripPassengers,
      });

    case "cab":
      return getCabBookingLinks({
        originName: params.tripFrom,
        destName: params.tripTo,
      });

    default:
      // For unknown travel segments, show all major transit options
      return [
        ...getTrainBookingLinks({ from: params.tripFrom, to: params.tripTo, date: params.tripDate, passengers: params.tripPassengers }),
        ...getBusBookingLinks({ from: params.tripFrom, to: params.tripTo, date: params.tripDate, passengers: params.tripPassengers }),
      ].slice(0, 4); // Cap at 4 for UI brevity
  }
}
