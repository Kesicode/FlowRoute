/**
 * lib/store/store.ts
 *
 * The central Zustand store for FlowRoute.
 * Combines all slices with localStorage persistence (trip + settings only).
 *
 * SSR safety: skipHydration: true — the <StoreHydration> client component
 * calls useFlowStore.persist.rehydrate() inside useEffect after mount.
 * Server renders with empty state → no hydration mismatch.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TRIP_STORAGE_KEY } from "@/lib/schemas";

import { createTripSlice, type TripSlice } from "./trip-slice";
import { createJourneySlice, type JourneySlice } from "./journey-slice";
import { createBudgetSlice, type BudgetSlice } from "./budget-slice";
import { createSettingsSlice, type SettingsSlice } from "./settings-slice";
import { createUISlice, type UISlice } from "./ui-slice";

// ─── Combined Store Type ──────────────────────────────────────────────────────

export type AppStore = TripSlice & JourneySlice & BudgetSlice & SettingsSlice & UISlice;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFlowStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createTripSlice(...args),
      ...createJourneySlice(...args),
      ...createBudgetSlice(...args),
      ...createSettingsSlice(...args),
      ...createUISlice(...args),
    }),
    {
      name: TRIP_STORAGE_KEY,   // "flowroute_trip_v1"
      skipHydration: true,      // Decision 3: client-side only, no SSR flash

      // Only persist trip + settings — ephemeral slices (journey, budget, ui)
      // are always recomputed on load.
      partialize: (state) => ({
        trip: state.trip,
        language: state.language,
        safetyMode: state.safetyMode,
        currency: state.currency,
        travelerProfile: state.travelerProfile,
        discoveryMode: state.discoveryMode,
        geolocationConsent: state.geolocationConsent,
      }),
    }
  )
);
