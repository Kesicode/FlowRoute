/**
 * hooks/useTripStore.ts
 *
 * Typed selector hooks for the Zustand store.
 * Components import these hooks — NEVER useFlowStore directly.
 *
 * IMPORTANT: Every selector that returns an object literal MUST use
 * useShallow() to shallow-compare the result. Without it, Zustand creates a
 * new object reference on every render, causing "getServerSnapshot should be
 * cached" / "Maximum update depth exceeded" infinite loops.
 */

import { useFlowStore } from "@/lib/store/store";
import { useShallow } from "zustand/react/shallow";

// ─── Trip selectors ────────────────────────────────────────────────────────────

/** Primitive: safe without useShallow */
export const useTripData = () => useFlowStore((s) => s.trip);

/** Primitive */
export const useTripStatus = () => useFlowStore((s) => s.trip?.status ?? null);

/** Primitive */
export const useTripIntent = () => useFlowStore((s) => s.trip?.intent ?? null);

/** Object — must use useShallow */
export const useTripActions = () =>
  useFlowStore(
    useShallow((s) => ({
      initTrip: s.initTrip,
      updateTripField: s.updateTripField,
      setAccommodation: s.setAccommodation,
      clearAccommodation: s.clearAccommodation,
      setTripStatus: s.setTripStatus,
      resetTrip: s.resetTrip,
    }))
  );

// ─── Journey selectors ─────────────────────────────────────────────────────────

/** Primitive */
export const useJourneyHealth = () => useFlowStore((s) => s.health);

/** Primitive */
export const useActiveSegmentId = () => useFlowStore((s) => s.activeSegmentId);

/** Primitive */
export const useLiveCoords = () => useFlowStore((s) => s.liveCoords);

/** Primitive */
export const useDeviationDetected = () => useFlowStore((s) => s.deviationDetected);

/** Derived boolean — primitive result, safe without useShallow */
export const useIsTracking = () =>
  useFlowStore((s) => s.geolocationConsent && s.liveCoords !== null);

/** Object — must use useShallow */
export const useJourneyActions = () =>
  useFlowStore(
    useShallow((s) => ({
      setActiveSegment: s.setActiveSegment,
      setHealth: s.setHealth,
      setDeviation: s.setDeviation,
      setLiveCoords: s.setLiveCoords,
      advanceSegment: s.advanceSegment,
      resetJourney: s.resetJourney,
    }))
  );

// ─── Budget selectors ─────────────────────────────────────────────────────────

/** Object — must use useShallow */
export const useBudgetState = () =>
  useFlowStore(
    useShallow((s) => ({
      allocation: s.allocation,
      committedAmount: s.committedAmount,
      remainingAmount: s.remainingAmount,
      budgetRisk: s.budgetRisk,
    }))
  );

/** Object — must use useShallow */
export const useBudgetActions = () =>
  useFlowStore(
    useShallow((s) => ({
      setAllocation: s.setAllocation,
      commitAmount: s.commitAmount,
      updateRemaining: s.updateRemaining,
      setBudgetRisk: s.setBudgetRisk,
      resetBudget: s.resetBudget,
    }))
  );

// ─── Settings selectors ────────────────────────────────────────────────────────

/** Primitive */
export const useLanguage = () => useFlowStore((s) => s.language);

/** Primitive */
export const useSafetyMode = () => useFlowStore((s) => s.safetyMode);

/** Primitive */
export const useEmergencyMode = () => useFlowStore((s) => s.emergencyMode);

/** Primitive */
export const useDiscoveryMode = () => useFlowStore((s) => s.discoveryMode);

/** Primitive */
export const useCurrency = () => useFlowStore((s) => s.currency);

/** Primitive */
export const useTravelerProfile = () => useFlowStore((s) => s.travelerProfile);

/** Primitive */
export const useGeolocationConsent = () => useFlowStore((s) => s.geolocationConsent);

/** Object — must use useShallow */
export const useUserProfile = () =>
  useFlowStore(useShallow((s) => s.userProfile));

/** Object — must use useShallow */
export const useSettingsActions = () =>
  useFlowStore(
    useShallow((s) => ({
      setLanguage: s.setLanguage,
      setSafetyMode: s.setSafetyMode,
      setEmergencyMode: s.setEmergencyMode,
      setDiscoveryMode: s.setDiscoveryMode,
      setCurrency: s.setCurrency,
      setTravelerProfile: s.setTravelerProfile,
      grantGeolocationConsent: s.grantGeolocationConsent,
      revokeGeolocationConsent: s.revokeGeolocationConsent,
      setUserProfile: s.setUserProfile,
    }))
  );

// ─── UI selectors ──────────────────────────────────────────────────────────────

/** Primitive */
export const useLoadingPhase = () => useFlowStore((s) => s.loadingPhase);

/** Primitive */
export const useActiveTab = () => useFlowStore((s) => s.activeTab);

/** Primitive */
export const useMobileViewOpen = () => useFlowStore((s) => s.mobileViewOpen);

/** Object — must use useShallow */
export const useUIActions = () =>
  useFlowStore(
    useShallow((s) => ({
      setActiveTab: s.setActiveTab,
      setMobileViewOpen: s.setMobileViewOpen,
      pushPanel: s.pushPanel,
      popPanel: s.popPanel,
      closeAllPanels: s.closeAllPanels,
      setLoadingPhase: s.setLoadingPhase,
    }))
  );

// ─── Trips list selectors ──────────────────────────────────────────────────────

/** Array — Zustand compares arrays by reference, which is stable for persist */
export const useSavedTrips = () => useFlowStore((s) => s.savedTrips);

/** Object — must use useShallow */
export const useTripsListActions = () =>
  useFlowStore(
    useShallow((s) => ({
      saveCurrentTrip: s.saveCurrentTrip,
      deleteSavedTrip: s.deleteSavedTrip,
      clearAllTrips: s.clearAllTrips,
    }))
  );
