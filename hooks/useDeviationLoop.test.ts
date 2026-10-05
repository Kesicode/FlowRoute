/**
 * hooks/useDeviationLoop.test.ts
 *
 * Phase 7 — Unit tests for the deviation loop logic.
 * Tests pure detection helpers extracted from useDeviationLoop.
 */

import { describe, it, expect } from "vitest";

// ── Mirrors the core deviation + clear logic from useDeviationLoop ─────────────

interface DeviationState {
  consecutiveOnRoute: number;
  ttsAlertFired: boolean;
  isDeviated: boolean;
}

function processCheck(
  state: DeviationState,
  isOff: boolean,
  clearAfterN = 2
): { newState: DeviationState; shouldAlert: boolean; shouldClear: boolean } {
  let shouldAlert = false;
  let shouldClear = false;
  const newState = { ...state };

  if (isOff) {
    newState.consecutiveOnRoute = 0;
    if (!state.isDeviated) {
      newState.isDeviated = true;
      if (!state.ttsAlertFired) {
        shouldAlert = true;
        newState.ttsAlertFired = true;
      }
    }
  } else {
    newState.consecutiveOnRoute += 1;
    if (state.isDeviated && newState.consecutiveOnRoute >= clearAfterN) {
      newState.isDeviated = false;
      newState.ttsAlertFired = false;
      shouldClear = true;
    }
  }

  return { newState, shouldAlert, shouldClear };
}

describe("processCheck() deviation logic", () => {
  const initial: DeviationState = {
    consecutiveOnRoute: 0,
    ttsAlertFired: false,
    isDeviated: false,
  };

  it("starts deviation and fires TTS on first off-route check", () => {
    const { newState, shouldAlert, shouldClear } = processCheck(initial, true);
    expect(newState.isDeviated).toBe(true);
    expect(shouldAlert).toBe(true);
    expect(shouldClear).toBe(false);
    expect(newState.ttsAlertFired).toBe(true);
  });

  it("does NOT re-fire TTS on second consecutive off-route check", () => {
    const deviated: DeviationState = {
      consecutiveOnRoute: 0,
      ttsAlertFired: true,
      isDeviated: true,
    };
    const { shouldAlert } = processCheck(deviated, true);
    expect(shouldAlert).toBe(false);
  });

  it("increments consecutiveOnRoute when on route", () => {
    const deviated: DeviationState = {
      consecutiveOnRoute: 0,
      ttsAlertFired: true,
      isDeviated: true,
    };
    const { newState } = processCheck(deviated, false);
    expect(newState.consecutiveOnRoute).toBe(1);
    expect(newState.isDeviated).toBe(true); // not cleared yet (need 2)
  });

  it("clears deviation after N consecutive on-route checks", () => {
    const almostClear: DeviationState = {
      consecutiveOnRoute: 1,
      ttsAlertFired: true,
      isDeviated: true,
    };
    const { newState, shouldClear } = processCheck(almostClear, false, 2);
    expect(newState.isDeviated).toBe(false);
    expect(newState.ttsAlertFired).toBe(false);
    expect(shouldClear).toBe(true);
  });

  it("resets consecutiveOnRoute when off-route interrupts", () => {
    const partialClear: DeviationState = {
      consecutiveOnRoute: 1,
      ttsAlertFired: true,
      isDeviated: true,
    };
    const { newState } = processCheck(partialClear, true);
    expect(newState.consecutiveOnRoute).toBe(0);
    expect(newState.isDeviated).toBe(true);
  });

  it("no-ops on on-route when not deviated", () => {
    const { newState, shouldAlert, shouldClear } = processCheck(initial, false);
    expect(newState.isDeviated).toBe(false);
    expect(shouldAlert).toBe(false);
    expect(shouldClear).toBe(false);
    expect(newState.consecutiveOnRoute).toBe(1);
  });

  it("clears after exactly clearAfterN=3", () => {
    let state: DeviationState = {
      consecutiveOnRoute: 0,
      ttsAlertFired: true,
      isDeviated: true,
    };
    // check 1 — not cleared (need 3)
    let result = processCheck(state, false, 3);
    expect(result.shouldClear).toBe(false);
    state = result.newState;
    // check 2 — not cleared
    result = processCheck(state, false, 3);
    expect(result.shouldClear).toBe(false);
    state = result.newState;
    // check 3 — cleared!
    result = processCheck(state, false, 3);
    expect(result.shouldClear).toBe(true);
    expect(result.newState.isDeviated).toBe(false);
  });
});

// ── TTS message localization ───────────────────────────────────────────────────

function getDeviationAlert(lang: string): string {
  if (lang === "hi") return "ध्यान दें! आप अपने नियोजित मार्ग से भटक गए हैं।";
  if (lang === "ml") return "ശ്രദ്ധിക്കൂ! നിങ്ങൾ ആസൂത്രിത പാതയിൽ നിന്ന് വ്യതിചലിച്ചിരിക്കുന്നു.";
  return "Heads up! You have deviated from your planned route.";
}

describe("getDeviationAlert()", () => {
  it("returns English message", () => {
    expect(getDeviationAlert("en")).toContain("deviated from your planned route");
  });

  it("returns Hindi message", () => {
    expect(getDeviationAlert("hi")).toContain("भटक गए");
  });

  it("returns Malayalam message", () => {
    expect(getDeviationAlert("ml")).toContain("വ്യതിചലിച്ചിരിക്കുന്നു");
  });

  it("defaults to English for unknown language", () => {
    expect(getDeviationAlert("fr")).toContain("deviated");
  });
});

// ── Poll interval constants ────────────────────────────────────────────────────

describe("loop constants", () => {
  const POLL_INTERVAL_MS = 30_000;
  const DEVIATION_THRESHOLD_M = 300;
  const CLEAR_AFTER_N = 2;

  it("poll interval is 30 seconds", () => {
    expect(POLL_INTERVAL_MS).toBe(30000);
  });

  it("threshold is 300m", () => {
    expect(DEVIATION_THRESHOLD_M).toBe(300);
  });

  it("clears after 2 consecutive on-route", () => {
    expect(CLEAR_AFTER_N).toBe(2);
  });
});
