/**
 * hooks/useTripStore.ts
 *
 * Typed selector hooks for the Zustand store.
 * Components import these hooks — NEVER useFlowStore directly.
 * Granular selectors prevent over-rendering.
 */

import { useFlowStore } from "@/lib/store/store";

// ─── Trip selectors ────────────────────────────────────────────────────────────

export const useTripData = () => useFlowStore((s) => s.trip);

export const useTripStatus = () => useFlowStore((s) => s.trip?.status ?? null);

export const useTripIntent = () => useFlowStore((s) => s.trip?.intent ?? null);

export const useTripActions = () =>
  useFlowStore((s) => ({
    initTrip: s.initTrip,
    updateTripField: s.updateTripField,
    setAccommodation: s.setAccommodation,
    clearAccommodation: s.clearAccommodation,
    setTripStatus: s.setTripStatus,
    resetTrip: s.resetTrip,
  }));

// ─── Journey selectors ─────────────────────────────────────────────────────────

export const useJourneyHealth = () => useFlowStore((s) => s.health);

export const useActiveSegmentId = () => useFlowStore((s) => s.activeSegmentId);

export const useLiveCoords = () => useFlowStore((s) => s.liveCoords);

export const useDeviationDetected = () => useFlowStore((s) => s.deviationDetected);

/** Returns true when GPS consent is granted AND live coordinates are being received. */
export const useIsTracking = () =>
  useFlowStore((s) => s.geolocationConsent && s.liveCoords !== null);

export const useJourneyActions = () =>
  useFlowStore((s) => ({
    setActiveSegment: s.setActiveSegment,
    setHealth: s.setHealth,
    setDeviation: s.setDeviation,
    setLiveCoords: s.setLiveCoords,
    advanceSegment: s.advanceSegment,
    resetJourney: s.resetJourney,
  }));

// ─── Budget selectors ─────────────────────────────────────────────────────────

export const useBudgetState = () =>
  useFlowStore((s) => ({
    allocation: s.allocation,
    committedAmount: s.committedAmount,
    remainingAmount: s.remainingAmount,
    budgetRisk: s.budgetRisk,
  }));

export const useBudgetActions = () =>
  useFlowStore((s) => ({
    setAllocation: s.setAllocation,
    commitAmount: s.commitAmount,
    updateRemaining: s.updateRemaining,
    setBudgetRisk: s.setBudgetRisk,
    resetBudget: s.resetBudget,
  }));

// ─── Settings selectors ────────────────────────────────────────────────────────

export const useLanguage = () => useFlowStore((s) => s.language);

export const useSafetyMode = () => useFlowStore((s) => s.safetyMode);

export const useEmergencyMode = () => useFlowStore((s) => s.emergencyMode);

export const useDiscoveryMode = () => useFlowStore((s) => s.discoveryMode);

export const useCurrency = () => useFlowStore((s) => s.currency);

export const useTravelerProfile = () => useFlowStore((s) => s.travelerProfile);

export const useGeolocationConsent = () => useFlowStore((s) => s.geolocationConsent);

export const useUserProfile = () => useFlowStore((s) => s.userProfile);

export const useSettingsActions = () =>
  useFlowStore((s) => ({
    setLanguage: s.setLanguage,
    setSafetyMode: s.setSafetyMode,
    setEmergencyMode: s.setEmergencyMode,
    setDiscoveryMode: s.setDiscoveryMode,
    setCurrency: s.setCurrency,
    setTravelerProfile: s.setTravelerProfile,
    grantGeolocationConsent: s.grantGeolocationConsent,
    revokeGeolocationConsent: s.revokeGeolocationConsent,
    setUserProfile: s.setUserProfile,
  }));

// ─── UI selectors ──────────────────────────────────────────────────────────────

export const useLoadingPhase = () => useFlowStore((s) => s.loadingPhase);

export const useActiveTab = () => useFlowStore((s) => s.activeTab);

export const useMobileViewOpen = () => useFlowStore((s) => s.mobileViewOpen);

export const useUIActions = () =>
  useFlowStore((s) => ({
    setActiveTab: s.setActiveTab,
    setMobileViewOpen: s.setMobileViewOpen,
    pushPanel: s.pushPanel,
    popPanel: s.popPanel,
    closeAllPanels: s.closeAllPanels,
    setLoadingPhase: s.setLoadingPhase,
  }));

// ─── Trips list selectors ──────────────────────────────────────────────────────

export const useSavedTrips = () => useFlowStore((s) => s.savedTrips);

export const useTripsListActions = () =>
  useFlowStore((s) => ({
    saveCurrentTrip: s.saveCurrentTrip,
    deleteSavedTrip: s.deleteSavedTrip,
    clearAllTrips: s.clearAllTrips,
  }));

