/**
 * hooks/useDeviationLoop.ts
 *
 * Phase 7 — Real-Time GPS Deviation Detection Loop
 *
 * Runs a 30-second interval that:
 *  1. Reads liveCoords from the Zustand journey-slice (set by useVoice GPS watch)
 *  2. Reads routeGeometry from the active selected route
 *  3. Calls detectDeviation(current, geometry, thresholdMeters=300)
 *  4. If deviation detected → setDeviation(true) in store + fires TTS alert
 *  5. If back on route for 2 consecutive checks → clears deviation
 *
 * Design decisions:
 *  • No GPS watch here — useVoice.ts already owns the GPS watch.
 *    This hook only reads liveCoords from the store (no duplicate Geolocation calls).
 *  • Threshold: 300m (generous for transit corridors like buses/trains)
 *  • TTS alert: fires once per deviation event, not every 30s
 *  • Stops automatically when:
 *      - geolocationConsent is false
 *      - no routeGeometry available
 *      - component using this hook unmounts
 */

import { useEffect, useRef, useCallback } from "react";
import { detectDeviation } from "@/lib/journey-engine";
import {
  useLiveCoords,
  useDeviationDetected,
  useGeolocationConsent,
  useJourneyActions,
} from "@/hooks/useTripStore";
import { useFlowStore } from "@/lib/store/store";

const POLL_INTERVAL_MS = 30_000; // 30 seconds
const DEVIATION_THRESHOLD_M = 300; // metres
const CLEAR_AFTER_N_CHECKS = 2; // clear deviation after 2 consecutive on-route checks

export function useDeviationLoop(
  routeGeometry: [number, number][], // [lat, lng][] from OSRM
  options?: {
    onDeviation?: () => void;
    onCleared?: () => void;
    tts?: (text: string) => void;
  }
) {
  const liveCoords = useLiveCoords();
  const deviationDetected = useDeviationDetected();
  const geolocationConsent = useGeolocationConsent();
  const { setDeviation } = useJourneyActions();
  const language = useFlowStore((s) => s.language);

  const consecutiveOnRouteRef = useRef(0);
  const ttsAlertFiredRef = useRef(false);

  const check = useCallback(() => {
    // Prerequisites
    if (!geolocationConsent) return;
    if (!liveCoords) return;
    if (!routeGeometry || routeGeometry.length === 0) return;

    const isOff = detectDeviation(liveCoords, routeGeometry, DEVIATION_THRESHOLD_M);

    if (isOff) {
      consecutiveOnRouteRef.current = 0;

      if (!deviationDetected) {
        setDeviation(true);
        options?.onDeviation?.();

        // TTS alert — fires once per deviation event
        if (!ttsAlertFiredRef.current && options?.tts) {
          ttsAlertFiredRef.current = true;
          const alertMsg =
            language === "hi"
              ? "ध्यान दें! आप अपने नियोजित मार्ग से भटक गए हैं।"
              : language === "ml"
              ? "ശ്രദ്ധിക്കൂ! നിങ്ങൾ ആസൂത്രിത പാതയിൽ നിന്ന് വ്യതിചലിച്ചിരിക്കുന്നു."
              : "Heads up! You have deviated from your planned route.";
          options.tts(alertMsg);
        }
      }
    } else {
      consecutiveOnRouteRef.current += 1;

      // Clear deviation only after N consecutive on-route checks
      if (
        deviationDetected &&
        consecutiveOnRouteRef.current >= CLEAR_AFTER_N_CHECKS
      ) {
        setDeviation(false);
        ttsAlertFiredRef.current = false;
        options?.onCleared?.();
      }
    }
  }, [
    liveCoords,
    routeGeometry,
    deviationDetected,
    geolocationConsent,
    setDeviation,
    language,
    options,
  ]);

  useEffect(() => {
    // Run immediately then on interval
    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [check]);

  return {
    deviationDetected,
    isRunning: geolocationConsent && routeGeometry.length > 0,
  };
}
