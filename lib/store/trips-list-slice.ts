/**
 * lib/store/trips-list-slice.ts
 *
 * Zustand slice for the saved trips list.
 * Persisted to localStorage alongside trip + settings slices.
 */
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { SavedTripSummary } from '@/types/trip';

const MAX_SAVED_TRIPS = 20;

export interface TripsListSlice {
  savedTrips: SavedTripSummary[];
  saveCurrentTrip: (trip: SavedTripSummary) => void;
  deleteSavedTrip: (id: string) => void;
  clearAllTrips: () => void;
}

export const createTripsListSlice: StateCreator<AppStore, [], [], TripsListSlice> = (set) => ({
  savedTrips: [],

  saveCurrentTrip: (trip) =>
    set((state) => {
      const filtered = state.savedTrips.filter((t) => t.id !== trip.id);
      const updated = [trip, ...filtered].slice(0, MAX_SAVED_TRIPS);
      return { savedTrips: updated };
    }),

  deleteSavedTrip: (id) =>
    set((state) => ({ savedTrips: state.savedTrips.filter((t) => t.id !== id) })),

  clearAllTrips: () => set({ savedTrips: [] }),
});
