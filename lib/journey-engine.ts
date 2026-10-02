/**
 * journey-engine.ts
 *
 * Pure functions for journey segment management, coherence validation,
 * connection risk assessment, and route deviation detection.
 *
 * No side effects. No imports from Next.js or React.
 * All functions are independently unit-testable.
 */

import type { JourneySegmentStatus } from "@/types/journey";
import type { SegmentDependency, TripIntent } from "@/types/trip";

// ─── Segment Model ────────────────────────────────────────────────────────────

export interface JourneySegment {
  id: string;
  type: "transport" | "accommodation" | "activity" | "food" | "rest";
  mode?: string;          // transport mode e.g. "train", "airplane"
  origin: string;
  destination: string;
  departureTime?: string; // ISO datetime
  arrivalTime?: string;   // ISO datetime
  durationMinutes?: number;
  status: JourneySegmentStatus;
  dayNumber?: number;
  notes?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export type ConnectionRisk = "none" | "low" | "high";

export interface ConnectionRiskResult {
  risk: ConnectionRisk;
  bufferMinutes: number;
  message: string;
}

// ─── createJourneySegments ────────────────────────────────────────────────────

/**
 * Creates a default set of journey segments from a TripIntent.
 * Used as the starting point before AI enrichment.
 */
export function createJourneySegments(intent: TripIntent): JourneySegment[] {
  const segments: JourneySegment[] = [];

  // Outbound leg
  segments.push({
    id: `seg-outbound-1`,
    type: "transport",
    mode: intent.travellers > 4 ? "train" : "bus",
    origin: intent.from,
    destination: intent.to,
    departureTime: intent.departureDate ? `${intent.departureDate}T08:00:00` : undefined,
    status: "scheduled",
    dayNumber: 1,
  });

  // Accommodation placeholder (if multi-day)
  if (intent.returnDate && intent.returnDate !== intent.departureDate) {
    segments.push({
      id: `seg-accommodation-1`,
      type: "accommodation",
      origin: intent.to,
      destination: intent.to,
      status: "scheduled",
      dayNumber: 1,
    });
  }

  // Return leg (if applicable)
  if (intent.returnDate) {
    segments.push({
      id: `seg-return-1`,
      type: "transport",
      mode: intent.travellers > 4 ? "train" : "bus",
      origin: intent.to,
      destination: intent.from,
      departureTime: `${intent.returnDate}T16:00:00`,
      status: "scheduled",
      dayNumber: computeDayNumber(intent.departureDate, intent.returnDate),
    });
  }

  return segments;
}

function computeDayNumber(start?: string, end?: string): number {
  if (!start || !end) return 1;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

// ─── validateCoherence ────────────────────────────────────────────────────────

/**
 * Checks that segments form a coherent journey:
 * - No overlapping times
 * - Destinations chain correctly (segment[n].destination === segment[n+1].origin)
 * - All required fields present
 */
export function validateCoherence(segments: JourneySegment[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (segments.length === 0) {
    return { valid: false, errors: ["No segments provided"], warnings: [] };
  }

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    // Required fields
    if (!seg.id) errors.push(`Segment ${i}: missing id`);
    if (!seg.origin) errors.push(`Segment ${i} (${seg.id}): missing origin`);
    if (!seg.destination) errors.push(`Segment ${i} (${seg.id}): missing destination`);

    // Time overlap check
    if (i > 0) {
      const prev = segments[i - 1];
      if (prev.arrivalTime && seg.departureTime) {
        const prevArrival = new Date(prev.arrivalTime).getTime();
        const thisDeparture = new Date(seg.departureTime).getTime();
        if (thisDeparture < prevArrival) {
          errors.push(
            `Segment ${seg.id} departs before segment ${prev.id} arrives — time overlap`
          );
        }
      }

      // Destination chain check (skip for accommodation segments)
      if (seg.type !== "accommodation" && prev.type !== "accommodation") {
        if (prev.destination && seg.origin && prev.destination !== seg.origin) {
          warnings.push(
            `Gap: segment ${prev.id} ends at "${prev.destination}" but segment ${seg.id} starts at "${seg.origin}"`
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── checkConnectionRisk ──────────────────────────────────────────────────────

/**
 * Evaluates whether a segment has enough buffer time to safely catch
 * its dependent connection (e.g. a flight after a train).
 */
export function checkConnectionRisk(
  segment: JourneySegment,
  dependency: SegmentDependency
): ConnectionRiskResult {
  const { minBufferMinutes } = dependency;

  if (!segment.departureTime) {
    return {
      risk: "none",
      bufferMinutes: 0,
      message: "No departure time — cannot assess connection risk",
    };
  }

  // Without the preceding segment's arrival we can only warn
  const bufferMinutes = segment.durationMinutes ?? 0;

  if (bufferMinutes === 0) {
    return {
      risk: "none",
      bufferMinutes: 0,
      message: "Buffer unknown — check connection manually",
    };
  }

  if (bufferMinutes < minBufferMinutes * 0.5) {
    return {
      risk: "high",
      bufferMinutes,
      message: `Only ${bufferMinutes}min buffer — minimum ${minBufferMinutes}min recommended`,
    };
  }

  if (bufferMinutes < minBufferMinutes) {
    return {
      risk: "low",
      bufferMinutes,
      message: `${bufferMinutes}min buffer is tight — ${minBufferMinutes}min recommended`,
    };
  }

  return {
    risk: "none",
    bufferMinutes,
    message: `${bufferMinutes}min buffer — connection looks safe`,
  };
}

// ─── detectDeviation ─────────────────────────────────────────────────────────

/**
 * Returns true if the current position is farther than `thresholdMeters`
 * from the nearest point in the route geometry.
 *
 * Uses Haversine distance for accuracy.
 */
export function detectDeviation(
  current: [number, number],
  routeGeometry: [number, number][],
  thresholdMeters = 200
): boolean {
  if (routeGeometry.length === 0) return false;

  const minDist = routeGeometry.reduce((min, point) => {
    const d = haversineMeters(current, point);
    return d < min ? d : min;
  }, Infinity);

  return minDist > thresholdMeters;
}

function haversineMeters([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]): number {
  const R = 6_371_000; // Earth radius in metres
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
