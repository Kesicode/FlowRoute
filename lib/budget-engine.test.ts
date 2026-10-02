import { describe, it, expect } from "vitest";
import { estimateBudget, getBudgetRisk, suggestCheaperAlternative } from "@/lib/budget-engine";
import type { TripIntent, BudgetAllocation } from "@/types/trip";

const baseIntent: TripIntent = {
  from: "Kochi",
  to: "Goa",
  departureDate: "2025-12-01",
  returnDate: "2025-12-04",
  travellers: 2,
  budget: 15000,
  currency: "INR",
  preferences: [],
  travelerProfile: "couple",
  safetyMode: false,
};

describe("estimateBudget", () => {
  it("returns an allocation with all five categories", () => {
    const alloc = estimateBudget(baseIntent);
    expect(alloc.transport).toBeDefined();
    expect(alloc.accommodation).toBeDefined();
    expect(alloc.food).toBeDefined();
    expect(alloc.activities).toBeDefined();
    expect(alloc.reserve).toBeDefined();
  });

  it("marks allocation as demo estimate", () => {
    const alloc = estimateBudget(baseIntent);
    expect(alloc.isDemoEstimate).toBe(true);
  });

  it("currency-qualifies all amounts", () => {
    const alloc = estimateBudget(baseIntent);
    expect(alloc.transport.currency).toBe("INR");
    expect(alloc.food.currency).toBe("INR");
  });

  it("converts to USD correctly (non-zero amounts)", () => {
    const intent: TripIntent = { ...baseIntent, currency: "USD" };
    const alloc = estimateBudget(intent);
    expect(alloc.currency).toBeUndefined(); // no top-level currency field
    expect(alloc.transport.currency).toBe("USD");
    expect(alloc.transport.amount).toBeGreaterThan(0);
  });

  it("returns zero accommodation for single-day trip", () => {
    const intent: TripIntent = { ...baseIntent, returnDate: undefined };
    const alloc = estimateBudget(intent);
    expect(alloc.accommodation.amount).toBe(0);
  });

  it("reserve is approximately 10% of subtotal", () => {
    const alloc = estimateBudget(baseIntent);
    const subtotal =
      alloc.transport.amount +
      alloc.accommodation.amount +
      alloc.food.amount +
      alloc.activities.amount;
    const ratio = alloc.reserve.amount / subtotal;
    expect(ratio).toBeCloseTo(0.1, 1);
  });
});

describe("getBudgetRisk", () => {
  const mockAlloc: BudgetAllocation = {
    transport: { amount: 3000, currency: "INR" },
    accommodation: { amount: 5000, currency: "INR" },
    food: { amount: 2000, currency: "INR" },
    activities: { amount: 1000, currency: "INR" },
    reserve: { amount: 1100, currency: "INR" },
    isDemoEstimate: true,
  };

  it("returns safe when under 80% spent", () => {
    expect(getBudgetRisk(mockAlloc, 5000)).toBe("safe");
  });

  it("returns warning when 80–99% spent", () => {
    const total = 3000 + 5000 + 2000 + 1000 + 1100; // 12100
    expect(getBudgetRisk(mockAlloc, Math.round(total * 0.85))).toBe("warning");
  });

  it("returns over when fully spent", () => {
    const total = 3000 + 5000 + 2000 + 1000 + 1100;
    expect(getBudgetRisk(mockAlloc, total + 1)).toBe("over");
  });

  it("returns safe for zero budget", () => {
    const zeroAlloc: BudgetAllocation = {
      transport: { amount: 0, currency: "INR" },
      accommodation: { amount: 0, currency: "INR" },
      food: { amount: 0, currency: "INR" },
      activities: { amount: 0, currency: "INR" },
      reserve: { amount: 0, currency: "INR" },
      isDemoEstimate: true,
    };
    expect(getBudgetRisk(zeroAlloc, 0)).toBe("safe");
  });
});

describe("suggestCheaperAlternative", () => {
  it("suggests accommodation switch when hotel cost is high", () => {
    const alloc = estimateBudget(baseIntent);
    const suggestion = suggestCheaperAlternative(alloc);
    expect(suggestion).not.toBeNull();
    expect(["transport", "accommodation"]).toContain(suggestion?.field);
  });

  it("returns null when all costs are low", () => {
    const cheapAlloc: BudgetAllocation = {
      transport: { amount: 100, currency: "INR" },
      accommodation: { amount: 100, currency: "INR" },
      food: { amount: 100, currency: "INR" },
      activities: { amount: 100, currency: "INR" },
      reserve: { amount: 40, currency: "INR" },
      isDemoEstimate: true,
    };
    expect(suggestCheaperAlternative(cheapAlloc)).toBeNull();
  });
});
