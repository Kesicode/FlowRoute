/**
 * lib/store/trip-slice.ts
 *
 * Zustand slice for the canonical TripState.
 * This slice is persisted to localStorage via store.ts partialize.
 */

import type { StateCreator } from "zustand";
import type { AppStore } from "./store";
import type { TripState, AccommodationOption } from "@/types/trip";
import type { TripIntent } from "@/lib/schemas";

export interface TripSlice {
  /** The active trip, or null if no trip is in progress. */
  trip: TripState | null;

  /** Seed a new trip from a parsed NL intent. Replaces any existing trip. */
  initTrip: (intent: TripIntent) => void;

  /** Update a single field on the current trip's intent. */
  updateTripField: <K extends keyof TripIntent>(field: K, value: TripIntent[K]) => void;

  /** Set the accommodation chosen for the trip. */
  setAccommodation: (option: AccommodationOption) => void;

  /** Clear accommodation choice. */
  clearAccommodation: () => void;

  /** Set the trip status. */
  setTripStatus: (status: TripState["status"]) => void;

  /** Completely reset the trip (e.g. user starts over). */
  resetTrip: () => void;
}

export const createTripSlice: StateCreator<AppStore, [], [], TripSlice> = (set) => ({
  trip: null,

  initTrip: (intent) =>
    set({
      trip: {
        id: `trip-${Date.now()}`,
        intent,
        status: "planning",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }),

  updateTripField: (field, value) =>
    set((state) => {
      if (!state.trip) return {};
      return {
        trip: {
          ...state.trip,
          intent: { ...state.trip.intent, [field]: value },
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  setAccommodation: (option) =>
    set((state) => {
      if (!state.trip) return {};
      return {
        trip: {
          ...state.trip,
          accommodation: option,
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  clearAccommodation: () =>
    set((state) => {
      if (!state.trip) return {};
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { accommodation: _acc, ...rest } = state.trip;
      return { trip: { ...rest, updatedAt: new Date().toISOString() } };
    }),

  setTripStatus: (status) =>
    set((state) => {
      if (!state.trip) return {};
      return { trip: { ...state.trip, status, updatedAt: new Date().toISOString() } };
    }),

  resetTrip: () => set({ trip: null }),
});
