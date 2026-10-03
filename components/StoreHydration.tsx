"use client";

/**
 * components/StoreHydration.tsx
 *
 * Handles client-side Zustand store rehydration from localStorage.
 * Must be rendered inside app/layout.tsx so it runs on every page.
 *
 * Why this exists:
 *   The Zustand persist middleware is configured with skipHydration: true
 *   to avoid SSR/hydration mismatches in Next.js App Router.
 *   This component triggers the actual rehydration safely inside useEffect
 *   (client only, after mount).
 *
 * Also handles Decision 5 (schema versioning):
 *   If the stored data fails Zod validation, it clears the key and shows
 *   a dismissable notice so the user isn't left in a broken state.
 */

import { useEffect, useState } from "react";
import { useFlowStore } from "@/lib/store/store";
import { TRIP_STORAGE_KEY, TripStateSchema } from "@/lib/schemas";
import { preloadRates } from "@/services/currency";


export function StoreHydration() {
  const [schemaResetNotice, setSchemaResetNotice] = useState(false);

  useEffect(() => {
    // Remove any legacy un-versioned key from a previous FlowRoute version
    localStorage.removeItem("flowroute_trip");

    // Validate stored trip data before rehydrating
    const raw = localStorage.getItem(TRIP_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const tripData = parsed?.state?.trip;
        if (tripData) {
          // Validate against current schema
          TripStateSchema.parse(tripData);
        }
      } catch {
        // Schema mismatch or corrupt data — clear and notify
        console.warn("[FlowRoute] Stored trip data is outdated — clearing localStorage");
        localStorage.removeItem(TRIP_STORAGE_KEY);
        setSchemaResetNotice(true);
      }
    }

    // Rehydrate the store from localStorage (now that we've validated it)
    useFlowStore.persist.rehydrate();

    // Phase 3 — preload FX rates into memory/localStorage so CurrencyDisplay
    // components don't need to wait for a network round-trip on first render.
    preloadRates();
  }, []);


  if (!schemaResetNotice) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-black text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-3"
    >
      <span>Your saved trip was cleared (format updated). Start a new journey!</span>
      <button
        onClick={() => setSchemaResetNotice(false)}
        className="ml-2 font-bold hover:opacity-70"
        aria-label="Dismiss notice"
      >
        ✕
      </button>
    </div>
  );
}
