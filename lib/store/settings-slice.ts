/**
 * lib/store/settings-slice.ts
 *
 * Zustand slice for user settings — language, safety mode, discovery mode,
 * currency, traveler profile, and geolocation consent.
 *
 * Persisted to localStorage alongside trip slice.
 */

import type { StateCreator } from "zustand";
import type { AppStore } from "./store";
import type { TravelerProfile, DiscoveryMode } from "@/types/trip";

export type Language = "en" | "hi" | "ml";
export type Currency = "INR" | "USD" | "EUR" | "GBP";

export interface SettingsSlice {
  language: Language;
  safetyMode: boolean;
  emergencyMode: boolean;
  discoveryMode: DiscoveryMode;
  currency: Currency;
  travelerProfile: TravelerProfile;
  /** User has consented to GPS location tracking for journey features. */
  geolocationConsent: boolean;

  setLanguage: (lang: Language) => void;
  setSafetyMode: (enabled: boolean) => void;
  setEmergencyMode: (enabled: boolean) => void;
  setDiscoveryMode: (mode: DiscoveryMode) => void;
  setCurrency: (currency: Currency) => void;
  setTravelerProfile: (profile: TravelerProfile) => void;
  grantGeolocationConsent: () => void;
  revokeGeolocationConsent: () => void;
}

export const createSettingsSlice: StateCreator<AppStore, [], [], SettingsSlice> = (set) => ({
  language: "en",
  safetyMode: false,
  emergencyMode: false,
  discoveryMode: "balanced",
  currency: "INR",
  travelerProfile: "solo",
  geolocationConsent: false,

  setLanguage: (language) => set({ language }),
  setSafetyMode: (safetyMode) => set({ safetyMode }),
  setEmergencyMode: (emergencyMode) => set({ emergencyMode }),
  setDiscoveryMode: (discoveryMode) => set({ discoveryMode }),
  setCurrency: (currency) => set({ currency }),
  setTravelerProfile: (travelerProfile) => set({ travelerProfile }),
  grantGeolocationConsent: () => set({ geolocationConsent: true }),
  revokeGeolocationConsent: () => set({ geolocationConsent: false }),
});
