/**
 * hooks/useTripExport.ts
 *
 * Phase 6 — Trip Export & Share Utilities
 *
 * Provides:
 *   exportTripJSON()   — downloads the current trip as a .json file
 *   copyShareURL()     — copies a shareable /journey?from=…&to=… URL
 *   importTripJSON()   — reads a .json file and rehydrates the trip store
 *   shareNative()      — calls navigator.share() on mobile (PWA)
 */

import { useCallback, useState } from "react";
import {
  useTripData,
  useSavedTrips,
  useTripActions,
  useTripsListActions,
} from "@/hooks/useTripStore";
import type { TripState } from "@/types/trip";

interface ExportState {
  copying: boolean;
  copied: boolean;
  exporting: boolean;
  importing: boolean;
  error: string | null;
}

export function useTripExport() {
  const tripData = useTripData();
  const savedTrips = useSavedTrips();
  const { initTrip } = useTripActions();
  const { saveCurrentTrip } = useTripsListActions();

  const [state, setState] = useState<ExportState>({
    copying: false,
    copied: false,
    exporting: false,
    importing: false,
    error: null,
  });

  // ── Export current trip as JSON file ─────────────────────────────────────────
  const exportTripJSON = useCallback(() => {
    if (!tripData) {
      setState((s) => ({ ...s, error: "No active trip to export." }));
      return;
    }

    setState((s) => ({ ...s, exporting: true, error: null }));

    try {
      const exportData = {
        _version: 1,
        _app: "FlowRoute",
        _exportedAt: new Date().toISOString(),
        trip: tripData,
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      const safeName = `${(tripData.from ?? "trip").replace(/\s+/g, "-")}-to-${(tripData.to ?? "dest").replace(/\s+/g, "-")}`;
      a.href = url;
      a.download = `flowroute-${safeName}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[useTripExport] export error:", err);
      setState((s) => ({ ...s, error: "Export failed. Please try again." }));
    } finally {
      setState((s) => ({ ...s, exporting: false }));
    }
  }, [tripData]);

  // ── Export ALL saved trips as JSON ────────────────────────────────────────────
  const exportAllTripsJSON = useCallback(() => {
    if (!savedTrips.length) {
      setState((s) => ({ ...s, error: "No saved trips to export." }));
      return;
    }

    const exportData = {
      _version: 1,
      _app: "FlowRoute",
      _exportedAt: new Date().toISOString(),
      savedTrips,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowroute-all-trips-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [savedTrips]);

  // ── Copy shareable URL to clipboard ──────────────────────────────────────────
  const copyShareURL = useCallback(async () => {
    if (!tripData) {
      setState((s) => ({ ...s, error: "No active trip to share." }));
      return;
    }

    setState((s) => ({ ...s, copying: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (tripData.from) params.set("from", tripData.from);
      if (tripData.to) params.set("to", tripData.to);
      if (tripData.budget) params.set("budget", String(tripData.budget));
      if (tripData.travellers) params.set("travellers", String(tripData.travellers));
      if (tripData.departureDate) params.set("date", tripData.departureDate);

      const shareURL = `${window.location.origin}/journey?${params.toString()}`;
      await navigator.clipboard.writeText(shareURL);

      setState((s) => ({ ...s, copied: true }));
      setTimeout(
        () => setState((s) => ({ ...s, copied: false, copying: false })),
        2500
      );
    } catch {
      setState((s) => ({
        ...s,
        copying: false,
        error: "Could not copy to clipboard.",
      }));
    }
  }, [tripData]);

  // ── Native share (mobile PWA) ─────────────────────────────────────────────────
  const shareNative = useCallback(async () => {
    if (!tripData || !("share" in navigator)) return false;

    try {
      await navigator.share({
        title: `FlowRoute: ${tripData.from} → ${tripData.to}`,
        text: `Check out my FlowRoute trip plan from ${tripData.from} to ${tripData.to}!`,
        url: `${window.location.origin}/journey?from=${encodeURIComponent(tripData.from ?? "")}&to=${encodeURIComponent(tripData.to ?? "")}`,
      });
      return true;
    } catch {
      return false;
    }
  }, [tripData]);

  // ── Import trip from JSON file ────────────────────────────────────────────────
  const importTripJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setState((s) => ({ ...s, importing: true, error: null }));

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        // Support both single-trip and all-trips exports
        const trip: TripState = parsed.trip ?? parsed;

        if (!trip.from || !trip.to) {
          throw new Error("Invalid trip file — missing from/to fields.");
        }

        // Rehydrate into store
        initTrip({
          from: trip.from,
          to: trip.to,
          budget: trip.budget,
          travellers: trip.travellers ?? 1,
          currency: trip.currency ?? "INR",
          preferences: trip.preferences ?? [],
          travelerProfile: trip.travelerProfile,
          departureDate: trip.departureDate,
          returnDate: trip.returnDate,
        });

        // Also save to list
        saveCurrentTrip({
          id: trip.id ?? `imported-${Date.now()}`,
          from: trip.from,
          to: trip.to,
          departureDate: trip.departureDate,
          returnDate: trip.returnDate,
          status: "planning",
          createdAt: new Date().toISOString(),
          travellers: trip.travellers,
          budget: trip.budget,
          currency: trip.currency ?? "INR",
        });
      } catch (err) {
        console.error("[useTripExport] import error:", err);
        setState((s) => ({
          ...s,
          error:
            err instanceof Error ? err.message : "Import failed — invalid file.",
        }));
      } finally {
        setState((s) => ({ ...s, importing: false }));
      }
    };

    input.click();
  }, [initTrip, saveCurrentTrip]);

  return {
    exportTripJSON,
    exportAllTripsJSON,
    copyShareURL,
    shareNative,
    importTripJSON,
    canShare: typeof navigator !== "undefined" && "share" in navigator,
    hasTrip: !!tripData,
    ...state,
  };
}
