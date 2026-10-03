"use client";

/**
 * lib/settings-context.tsx
 *
 * PHASE 2: This file is now a thin bridge to Zustand.
 *
 * All existing call-sites using:
 *   import { useSettings } from '@/lib/settings-context'
 *   import { SettingsProvider } from '@/lib/settings-context'
 * continue to work with zero changes.
 *
 * The dual-localStorage system (flowroute_lang, flowroute_safety) has been
 * removed. Settings now live exclusively in Zustand (flowroute_trip_v1).
 *
 * SettingsProvider is a passthrough — the real provider is StoreHydration
 * (already wired in app/layout.tsx).
 */

import React from "react";
import {
  useLanguage,
  useSafetyMode,
  useEmergencyMode,
  useSettingsActions,
} from "@/hooks/useTripStore";

/** Re-export Language so existing imports like `import { Language } from '@/lib/settings-context'` still work. */
export type { Language } from "@/lib/store/settings-slice";

/** SettingsProvider is now a passthrough. Zustand/StoreHydration handles all state. */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * useSettings() — drop-in replacement for the old context hook.
 * Returns the same shape as before; backed by Zustand selectors.
 */
export function useSettings() {
  const language = useLanguage();
  const safetyMode = useSafetyMode();
  const emergencyMode = useEmergencyMode();
  const { setLanguage, setSafetyMode, setEmergencyMode } = useSettingsActions();

  return {
    language,
    setLanguage,
    safetyMode,
    setSafetyMode,
    emergencyMode,
    setEmergencyMode,
  };
}
