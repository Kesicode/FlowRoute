/**
 * lib/store/journey-slice.ts
 *
 * Zustand slice for live journey state — active segment, health, deviation.
 * Ephemeral: NOT persisted. Resets on page load.
 */

import type { StateCreator } from "zustand";
import type { AppStore } from "./store";
import type { JourneyHealth } from "@/types/trip";

export interface JourneySlice {
  /** ID of the segment currently active/in-progress. */
  activeSegmentId: string | null;
  /** Overall health of the journey. */
  health: JourneyHealth;
  /** Whether the user is off their planned route. */
  deviationDetected: boolean;
  /** Most recent GPS coordinates [lat, lng]. */
  liveCoords: [number, number] | null;

  setActiveSegment: (id: string | null) => void;
  setHealth: (health: JourneyHealth) => void;
  setDeviation: (detected: boolean) => void;
  setLiveCoords: (coords: [number, number] | null) => void;
  advanceSegment: (nextId: string) => void;
  resetJourney: () => void;
}

const DEFAULT_JOURNEY: Pick<
  JourneySlice,
  "activeSegmentId" | "health" | "deviationDetected" | "liveCoords"
> = {
  activeSegmentId: null,
  health: "on_track",
  deviationDetected: false,
  liveCoords: null,
};

export const createJourneySlice: StateCreator<AppStore, [], [], JourneySlice> = (set) => ({
  ...DEFAULT_JOURNEY,

  setActiveSegment: (id) => set({ activeSegmentId: id }),

  setHealth: (health) => set({ health }),

  setDeviation: (detected) =>
    set((state) => ({
      deviationDetected: detected,
      health: detected && state.health === "on_track" ? "at_risk" : state.health,
    })),

  setLiveCoords: (coords) => set({ liveCoords: coords }),

  advanceSegment: (nextId) =>
    set({
      activeSegmentId: nextId,
      deviationDetected: false,
    }),

  resetJourney: () => set(DEFAULT_JOURNEY),
});
