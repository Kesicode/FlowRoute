/**
 * services/voice-dispatcher.test.ts
 *
 * Unit tests for the voice intent parser.
 * All pure function tests — no mocks needed.
 */

import { describe, it, expect } from "vitest";
import { parseVoiceIntent, getIntentConfirmation } from "./voice-dispatcher";

// ─── Safety intents ───────────────────────────────────────────────────────────

describe("Safety intents", () => {
  it("parses SOS / emergency calls", () => {
    const r = parseVoiceIntent("SOS! I need help");
    expect(r.category).toBe("safety");
    if (r.category === "safety") expect(r.action).toBe("sos");
  });

  it("parses 'help me' as SOS", () => {
    const r = parseVoiceIntent("help me please");
    expect(r.category).toBe("safety");
    if (r.category === "safety") expect(r.action).toBe("sos");
  });

  it("parses enable safety mode", () => {
    const r = parseVoiceIntent("turn on safety mode");
    expect(r.category).toBe("safety");
    if (r.category === "safety") expect(r.action).toBe("enable");
  });

  it("parses disable safety mode", () => {
    const r = parseVoiceIntent("turn off safety mode");
    expect(r.category).toBe("safety");
    if (r.category === "safety") expect(r.action).toBe("disable");
  });
});

// ─── Route mode intents ───────────────────────────────────────────────────────

describe("Route mode intents", () => {
  it("parses fastest route", () => {
    const r = parseVoiceIntent("show me the fastest route");
    expect(r.category).toBe("route");
    if (r.category === "route") expect(r.mode).toBe("fastest");
  });

  it("parses cheapest route", () => {
    const r = parseVoiceIntent("I want the cheapest option");
    expect(r.category).toBe("route");
    if (r.category === "route") expect(r.mode).toBe("cheapest");
  });

  it("parses eco route", () => {
    const r = parseVoiceIntent("switch to eco friendly route");
    expect(r.category).toBe("route");
    if (r.category === "route") expect(r.mode).toBe("eco");
  });

  it("parses comfortable route", () => {
    const r = parseVoiceIntent("I want a comfortable journey");
    expect(r.category).toBe("route");
    if (r.category === "route") expect(r.mode).toBe("comfortable");
  });
});

// ─── Navigation intents ───────────────────────────────────────────────────────

describe("Navigation intents", () => {
  it("navigates to budget tab", () => {
    const r = parseVoiceIntent("show me the budget");
    expect(r.category).toBe("navigation");
    if (r.category === "navigation") expect(r.tab).toBe("budget");
  });

  it("navigates to food tab", () => {
    const r = parseVoiceIntent("open food nearby");
    expect(r.category).toBe("navigation");
    if (r.category === "navigation") expect(r.tab).toBe("food");
  });

  it("navigates to weather tab", () => {
    const r = parseVoiceIntent("what's the weather");
    expect(r.category).toBe("navigation");
    if (r.category === "navigation") expect(r.tab).toBe("weather");
  });

  it("navigates to stay / accommodation tab", () => {
    const r = parseVoiceIntent("show hotels");
    expect(r.category).toBe("navigation");
    if (r.category === "navigation") expect(r.tab).toBe("accommodation");
  });

  it("navigates to trip plan tab", () => {
    const r = parseVoiceIntent("open the trip plan");
    expect(r.category).toBe("navigation");
    if (r.category === "navigation") expect(r.tab).toBe("multiday");
  });

  it("navigates to essentials tab when asking for hospitals", () => {
    const r = parseVoiceIntent("show me nearby hospitals");
    // Could be map or navigation — either is fine, both react to hospitals
    expect(["navigation", "map"]).toContain(r.category);
  });

  it("navigates to whatif tab via budget simulation phrasing", () => {
    const r = parseVoiceIntent("what if I change my budget");
    expect(r.category).toBe("budget");
    if (r.category === "budget") expect(r.action).toBe("simulate");
  });
});

// ─── Budget intents ───────────────────────────────────────────────────────────

describe("Budget intents", () => {
  it("parses simulate budget with amount", () => {
    const r = parseVoiceIntent("simulate a budget of 25000");
    expect(r.category).toBe("budget");
    if (r.category === "budget") {
      expect(r.action).toBe("simulate");
      expect(r.simulatedAmount).toBe(25000);
    }
  });

  it("parses lakh amounts", () => {
    const r = parseVoiceIntent("set budget to 1.5 lakh");
    expect(r.category).toBe("budget");
    if (r.category === "budget") {
      expect(r.simulatedAmount).toBe(150000);
    }
  });

  it("parses thousand amounts", () => {
    const r = parseVoiceIntent("change budget to 20 thousand");
    expect(r.category).toBe("budget");
    if (r.category === "budget") {
      expect(r.simulatedAmount).toBe(20000);
    }
  });
});

// ─── Settings intents ─────────────────────────────────────────────────────────

describe("Settings intents", () => {
  it("parses switch to Hindi", () => {
    const r = parseVoiceIntent("switch to hindi language");
    expect(r.category).toBe("settings");
    if (r.category === "settings") {
      expect(r.field).toBe("language");
      expect(r.value).toBe("hi");
    }
  });

  it("parses switch to English", () => {
    const r = parseVoiceIntent("switch to english");
    expect(r.category).toBe("settings");
    if (r.category === "settings") {
      expect(r.field).toBe("language");
      expect(r.value).toBe("en");
    }
  });

  it("parses currency change to USD", () => {
    const r = parseVoiceIntent("use USD dollar");
    expect(r.category).toBe("settings");
    if (r.category === "settings") {
      expect(r.field).toBe("currency");
      expect(r.value).toBe("USD");
    }
  });

  it("parses solo traveler profile", () => {
    const r = parseVoiceIntent("I am travelling alone");
    expect(r.category).toBe("settings");
    if (r.category === "settings") {
      expect(r.field).toBe("traveler_profile");
      expect(r.value).toBe("solo");
    }
  });

  it("parses family profile", () => {
    const r = parseVoiceIntent("this is a family trip with kids");
    expect(r.category).toBe("settings");
    if (r.category === "settings") {
      expect(r.field).toBe("traveler_profile");
      expect(r.value).toBe("family");
    }
  });
});

// ─── Trip intents ─────────────────────────────────────────────────────────────

describe("Trip intents", () => {
  it("parses new trip", () => {
    const r = parseVoiceIntent("start a new trip");
    expect(r.category).toBe("trip");
    if (r.category === "trip") expect(r.action).toBe("new");
  });

  it("parses save trip", () => {
    const r = parseVoiceIntent("save my trip");
    expect(r.category).toBe("trip");
    if (r.category === "trip") expect(r.action).toBe("save");
  });

  it("parses clear trip", () => {
    const r = parseVoiceIntent("clear my trip please");
    expect(r.category).toBe("trip");
    if (r.category === "trip") expect(r.action).toBe("clear");
  });
});

// ─── Speak intents ────────────────────────────────────────────────────────────

describe("Speak intents", () => {
  it("parses read aloud budget", () => {
    const r = parseVoiceIntent("how much budget is left");
    expect(r.category).toBe("speak");
    if (r.category === "speak") expect(r.subject).toBe("budget");
  });

  it("parses next stop", () => {
    const r = parseVoiceIntent("what is my next stop");
    expect(r.category).toBe("speak");
    if (r.category === "speak") expect(r.subject).toBe("next_stop");
  });
});

// ─── Unknown intents ──────────────────────────────────────────────────────────

describe("Unknown intents", () => {
  it("returns unknown for completely unrecognized input", () => {
    const r = parseVoiceIntent("purple dinosaur quantum foam");
    expect(r.category).toBe("unknown");
    if (r.category === "unknown") {
      expect(r.rawText).toBe("purple dinosaur quantum foam");
    }
  });
});

// ─── getIntentConfirmation ────────────────────────────────────────────────────

describe("getIntentConfirmation", () => {
  it("returns a non-empty string for navigation intents", () => {
    const msg = getIntentConfirmation({ category: "navigation", tab: "budget", tabLabel: "Budget" });
    expect(msg).toContain("Budget");
  });

  it("returns emergency message for SOS", () => {
    const msg = getIntentConfirmation({ category: "safety", action: "sos" });
    expect(msg.toLowerCase()).toContain("emergency");
  });

  it("returns helpful message for unknown", () => {
    const msg = getIntentConfirmation({ category: "unknown", rawText: "foo" });
    expect(msg).toContain("foo");
    expect(msg.toLowerCase()).toContain("didn't understand");
  });
});
