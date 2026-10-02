import { describe, it, expect } from "vitest";
import {
  createJourneySegments,
  validateCoherence,
  checkConnectionRisk,
  detectDeviation,
  type JourneySegment,
} from "@/lib/journey-engine";
import type { TripIntent } from "@/types/trip";

const baseIntent: TripIntent = {
  from: "Kochi",
  to: "Goa",
  departureDate: "2025-12-01",
  returnDate: "2025-12-04",
  travellers: 2,
  budget: 15000,
  currency: "INR",
  preferences: ["budget"],
  travelerProfile: "couple",
  safetyMode: false,
};

describe("createJourneySegments", () => {
  it("creates outbound + accommodation + return for multi-day trip", () => {
    const segments = createJourneySegments(baseIntent);
    expect(segments.length).toBe(3);
    expect(segments[0].type).toBe("transport");
    expect(segments[1].type).toBe("accommodation");
    expect(segments[2].type).toBe("transport");
  });

  it("creates only outbound for single-day trip", () => {
    const intent: TripIntent = { ...baseIntent, returnDate: undefined };
    const segments = createJourneySegments(intent);
    expect(segments.length).toBe(1);
  });

  it("assigns correct origin and destination", () => {
    const segments = createJourneySegments(baseIntent);
    expect(segments[0].origin).toBe("Kochi");
    expect(segments[0].destination).toBe("Goa");
    expect(segments[2].origin).toBe("Goa");
    expect(segments[2].destination).toBe("Kochi");
  });

  it("all segments have scheduled status", () => {
    const segments = createJourneySegments(baseIntent);
    segments.forEach((s) => expect(s.status).toBe("scheduled"));
  });
});

describe("validateCoherence", () => {
  it("returns invalid for empty segments", () => {
    const result = validateCoherence([]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("No segments provided");
  });

  it("returns valid for coherent segments without time data", () => {
    const segments: JourneySegment[] = [
      { id: "s1", type: "transport", origin: "A", destination: "B", status: "scheduled" },
      { id: "s2", type: "transport", origin: "B", destination: "C", status: "scheduled" },
    ];
    const result = validateCoherence(segments);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects time overlap between segments", () => {
    const segments: JourneySegment[] = [
      {
        id: "s1",
        type: "transport",
        origin: "A",
        destination: "B",
        status: "scheduled",
        arrivalTime: "2025-12-01T12:00:00",
      },
      {
        id: "s2",
        type: "transport",
        origin: "B",
        destination: "C",
        status: "scheduled",
        departureTime: "2025-12-01T10:00:00", // before s1 arrival
      },
    ];
    const result = validateCoherence(segments);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/time overlap/);
  });

  it("warns on destination chain gap", () => {
    const segments: JourneySegment[] = [
      { id: "s1", type: "transport", origin: "A", destination: "B", status: "scheduled" },
      { id: "s2", type: "transport", origin: "C", destination: "D", status: "scheduled" }, // gap A→B then C
    ];
    const result = validateCoherence(segments);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("returns invalid when segment missing id", () => {
    const segments: JourneySegment[] = [
      { id: "", type: "transport", origin: "A", destination: "B", status: "scheduled" },
    ];
    const result = validateCoherence(segments);
    expect(result.valid).toBe(false);
  });
});

describe("checkConnectionRisk", () => {
  const dep = { segmentId: "s2", dependsOnSegmentId: "s1", type: "connect" as const, minBufferMinutes: 60 };

  it("returns none for safe buffer", () => {
    const seg: JourneySegment = {
      id: "s2",
      type: "transport",
      origin: "A",
      destination: "B",
      status: "scheduled",
      departureTime: "2025-12-01T10:00:00",
      durationMinutes: 90,
    };
    const result = checkConnectionRisk(seg, dep);
    expect(result.risk).toBe("none");
  });

  it("returns high risk for very tight buffer", () => {
    const seg: JourneySegment = {
      id: "s2",
      type: "transport",
      origin: "A",
      destination: "B",
      status: "scheduled",
      departureTime: "2025-12-01T10:00:00",
      durationMinutes: 20, // < 60 * 0.5
    };
    const result = checkConnectionRisk(seg, dep);
    expect(result.risk).toBe("high");
  });

  it("returns low risk for tight but not critical buffer", () => {
    const seg: JourneySegment = {
      id: "s2",
      type: "transport",
      origin: "A",
      destination: "B",
      status: "scheduled",
      departureTime: "2025-12-01T10:00:00",
      durationMinutes: 45, // < 60 but >= 30
    };
    const result = checkConnectionRisk(seg, dep);
    expect(result.risk).toBe("low");
  });
});

describe("detectDeviation", () => {
  it("returns false when on route", () => {
    const route: [number, number][] = [
      [10.0, 76.0],
      [10.5, 76.5],
      [11.0, 77.0],
    ];
    const current: [number, number] = [10.5, 76.5]; // exactly on route
    expect(detectDeviation(current, route, 200)).toBe(false);
  });

  it("returns true when far off route", () => {
    const route: [number, number][] = [
      [10.0, 76.0],
      [10.5, 76.5],
    ];
    const current: [number, number] = [15.0, 80.0]; // far away
    expect(detectDeviation(current, route, 200)).toBe(true);
  });

  it("returns false for empty route", () => {
    expect(detectDeviation([10, 76], [], 200)).toBe(false);
  });
});
