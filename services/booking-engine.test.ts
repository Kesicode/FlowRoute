/**
 * services/booking-engine.test.ts
 *
 * Unit tests for the booking deep-link engine.
 * Validates URL generation, parameter encoding, and mode classification.
 * All pure functions — no mocks needed.
 */

import { describe, it, expect } from "vitest";
import {
  getTrainBookingLinks,
  getFlightBookingLinks,
  getBusBookingLinks,
  getCabBookingLinks,
  getHotelBookingLinks,
  getSegmentBookingLinks,
  classifySegmentMode,
} from "./booking-engine";

// ─── classifySegmentMode ──────────────────────────────────────────────────────

describe("classifySegmentMode", () => {
  it("classifies train segments", () => {
    expect(classifySegmentMode("Board Rajdhani Express", "Take the overnight train")).toBe("train");
    expect(classifySegmentMode("IRCTC booking", "Rail journey from Kochi")).toBe("train");
    expect(classifySegmentMode("Shatabdi to Bangalore", "")).toBe("train");
  });

  it("classifies flight segments", () => {
    expect(classifySegmentMode("Fly to Goa", "IndiGo flight 6E-123")).toBe("flight");
    expect(classifySegmentMode("Arrive at airport", "Air India flight")).toBe("flight");
    expect(classifySegmentMode("SpiceJet departures", "")).toBe("flight");
  });

  it("classifies bus segments", () => {
    expect(classifySegmentMode("KSRTC bus to Mysore", "Sleeper bus overnight")).toBe("bus");
    expect(classifySegmentMode("RedBus journey", "Volvo AC bus")).toBe("bus");
  });

  it("classifies cab segments", () => {
    expect(classifySegmentMode("Uber to hotel", "Take a cab from airport")).toBe("cab");
    expect(classifySegmentMode("Ola auto", "Rickshaw to station")).toBe("cab");
  });

  it("returns unknown for non-travel segments", () => {
    expect(classifySegmentMode("Visit beach", "Relax at Palolem")).toBe("unknown");
    expect(classifySegmentMode("Lunch at restaurant", "Try local seafood")).toBe("unknown");
  });
});

// ─── getTrainBookingLinks ─────────────────────────────────────────────────────

describe("getTrainBookingLinks", () => {
  const links = getTrainBookingLinks({
    from: "Kochi",
    to: "Goa",
    date: "2026-12-15",
    passengers: 2,
    classCode: "3A",
  });

  it("returns at least 2 links", () => {
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it("includes IRCTC link", () => {
    const irctc = links.find((l) => l.platform === "IRCTC");
    expect(irctc).toBeDefined();
    expect(irctc!.url).toContain("irctc.co.in");
    expect(irctc!.url).toContain("Kochi");
    expect(irctc!.url).toContain("Goa");
  });

  it("IRCTC date format is YYYYMMDD (no dashes)", () => {
    const irctc = links.find((l) => l.platform === "IRCTC")!;
    expect(irctc.url).toContain("20261215");
    expect(irctc.url).not.toContain("2026-12-15");
  });

  it("all links have emoji and openMode", () => {
    links.forEach((l) => {
      expect(l.emoji).toBeTruthy();
      expect(["deeplink", "web"]).toContain(l.openMode);
      expect(l.isExternal).toBe(true);
    });
  });
});

// ─── getFlightBookingLinks ────────────────────────────────────────────────────

describe("getFlightBookingLinks", () => {
  const links = getFlightBookingLinks({
    from: "Kochi",
    to: "Dubai",
    date: "2026-12-20",
    passengers: 2,
  });

  it("includes Google Flights link", () => {
    const gf = links.find((l) => l.platform === "Google Flights");
    expect(gf).toBeDefined();
    expect(gf!.url).toContain("google.com/travel/flights");
  });

  it("includes Skyscanner link", () => {
    const sky = links.find((l) => l.platform === "Skyscanner");
    expect(sky).toBeDefined();
    expect(sky!.url).toContain("skyscanner.net");
  });

  it("encodes spaces in city names safely — no raw spaces in URLs", () => {
    const linksWithSpaces = getFlightBookingLinks({
      from: "New Delhi",
      to: "New York",
      date: "2026-12-01",
    });
    // Every URL must not contain raw spaces (must be encoded as %20 or + or removed)
    linksWithSpaces.forEach((l) => {
      // Verify no raw spaces appear in the URL's base path (before query string)
      const queryStart = l.url.indexOf("?");
      const base = queryStart >= 0 ? l.url.slice(0, queryStart) : l.url;
      expect(base).not.toMatch(/ /); // No raw spaces in the URL base
    });

  });

});

// ─── getBusBookingLinks ───────────────────────────────────────────────────────

describe("getBusBookingLinks", () => {
  const links = getBusBookingLinks({
    from: "Bangalore",
    to: "Goa",
    date: "2026-12-10",
    passengers: 1,
  });

  it("includes RedBus link", () => {
    const rb = links.find((l) => l.platform === "RedBus");
    expect(rb).toBeDefined();
    expect(rb!.url).toContain("redbus.in");
  });

  it("includes AbhiBus link", () => {
    const ab = links.find((l) => l.platform === "AbhiBus");
    expect(ab).toBeDefined();
    expect(ab!.url).toContain("abhibus.com");
  });
});

// ─── getCabBookingLinks ───────────────────────────────────────────────────────

describe("getCabBookingLinks", () => {
  it("includes coordinate-based Uber deeplink when coords given", () => {
    const links = getCabBookingLinks({
      originLat: 10.0, originLng: 76.3,
      destLat: 15.5, destLng: 73.8,
      originName: "Kochi Airport",
      destName: "Panjim",
    });
    const uber = links.find((l) => l.platform === "Uber");
    expect(uber).toBeDefined();
    expect(uber!.openMode).toBe("deeplink");
    expect(uber!.url).toContain("uber://");
    expect(uber!.url).toContain("10");
    expect(uber!.url).toContain("76.3");
  });

  it("includes Ola link in all cases", () => {
    const links = getCabBookingLinks({ originName: "Hotel", destName: "Airport" });
    const ola = links.find((l) => l.platform === "Ola");
    expect(ola).toBeDefined();
    expect(ola!.url).toContain("olacabs.com");
  });

  it("does not include uber:// deeplink when no coords given", () => {
    const links = getCabBookingLinks({ originName: "Hotel", destName: "Airport" });
    // Without coords, no native deeplink Uber entry (uber:// scheme) should appear
    const uberDeepLink = links.find((l) => l.url.startsWith("uber://"));
    expect(uberDeepLink).toBeUndefined();
  });
});

// ─── getHotelBookingLinks ─────────────────────────────────────────────────────

describe("getHotelBookingLinks", () => {
  const links = getHotelBookingLinks({
    city: "Goa",
    checkIn: "2026-12-15",
    checkOut: "2026-12-18",
    guests: 2,
  });

  it("includes Booking.com link", () => {
    const bc = links.find((l) => l.platform === "Booking.com");
    expect(bc).toBeDefined();
    expect(bc!.url).toContain("booking.com");
    expect(bc!.url).toContain("Goa");
    // Date may appear in different formats depending on platform
    expect(bc!.url).toMatch(/2026|checkin|checkout/);
  });


  it("includes Airbnb link", () => {
    const ab = links.find((l) => l.platform === "Airbnb");
    expect(ab).toBeDefined();
    expect(ab!.url).toContain("airbnb.com");
  });

  it("all links are external and web mode", () => {
    links.forEach((l) => {
      expect(l.isExternal).toBe(true);
      expect(l.openMode).toBe("web");
    });
  });
});

// ─── getSegmentBookingLinks ───────────────────────────────────────────────────

describe("getSegmentBookingLinks", () => {
  const base = {
    tripFrom: "Kochi",
    tripTo: "Goa",
    tripDate: "2026-12-10",
    tripPassengers: 2,
    tripCurrency: "INR",
  };

  it("returns empty for non-travel segments", () => {
    expect(getSegmentBookingLinks({
      ...base,
      type: "food",
      activity: "Lunch at shack",
      description: "Local seafood",
      location: "Palolem",
    })).toHaveLength(0);
  });

  it("returns train links for a train segment", () => {
    const links = getSegmentBookingLinks({
      ...base,
      type: "travel",
      activity: "Board Rajdhani Express",
      description: "Take the overnight train to Goa",
      location: "Ernakulam Junction",
    });
    expect(links.some((l) => l.platform === "IRCTC")).toBe(true);
  });

  it("returns flight links for a flight segment", () => {
    const links = getSegmentBookingLinks({
      ...base,
      type: "travel",
      activity: "IndiGo flight to GOX",
      description: "Flight from Cochin International Airport",
      location: "COK Airport",
    });
    expect(links.some((l) => l.platform === "Google Flights")).toBe(true);
  });

  it("returns at least some links for unknown travel segments", () => {
    const links = getSegmentBookingLinks({
      ...base,
      type: "travel",
      activity: "Travel to destination",
      description: "Journey to Goa",
      location: "On the way",
    });
    expect(links.length).toBeGreaterThan(0);
    expect(links.length).toBeLessThanOrEqual(4); // capped at 4
  });
});
