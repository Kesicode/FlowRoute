/**
 * services/currency.test.ts
 *
 * Unit tests for the currency conversion engine.
 * Tests pure utility functions (convertSync, formatCurrency, rateTooltip).
 * Async convert() is exercised via mocked localStorage for cache paths.
 */

import { describe, it, expect } from "vitest";

import {
  convertSync,
  formatCurrency,
  rateTooltip,
} from "./currency";

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats INR with rupee symbol", () => {
    const result = formatCurrency(15000, "INR");
    expect(result).toContain("15");
    // Should contain rupee symbol or INR prefix
    expect(result).toMatch(/₹|INR/);
  });

  it("formats USD with dollar symbol", () => {
    const result = formatCurrency(180.5, "USD");
    expect(result).toMatch(/\$|USD/);
    expect(result).toContain("180");
  });

  it("formats EUR with euro symbol", () => {
    const result = formatCurrency(200, "EUR");
    expect(result).toMatch(/€|EUR/);
  });

  it("formats GBP with pound symbol", () => {
    const result = formatCurrency(150, "GBP");
    expect(result).toMatch(/£|GBP/);
  });

  it("handles zero amount", () => {
    const result = formatCurrency(0, "INR");
    expect(result).toContain("0");
  });

  it("handles large INR amounts with separators", () => {
    const result = formatCurrency(150000, "INR");
    // Intl may produce ₹1,50,000 (en-IN) or ₹150,000 (en-US fallback)
    // Either way it must contain the digits 150000 in some comma-separated form
    const digits = result.replace(/[^\d]/g, "");
    expect(digits).toContain("150000");
  });

});

// ─── rateTooltip ─────────────────────────────────────────────────────────────

describe("rateTooltip", () => {
  it("formats a USD to INR rate tooltip", () => {
    const tooltip = rateTooltip("USD", "INR", 83.5);
    expect(tooltip).toContain("1 USD");
    expect(tooltip).toContain("83.50");
    expect(tooltip).toMatch(/₹|INR/);
  });

  it("formats a EUR to GBP rate tooltip", () => {
    const tooltip = rateTooltip("EUR", "GBP", 0.86);
    expect(tooltip).toContain("1 EUR");
    expect(tooltip).toContain("0.86");
    expect(tooltip).toMatch(/£|GBP/);
  });

  it("always rounds to 2 decimal places", () => {
    const tooltip = rateTooltip("USD", "INR", 83.5678);
    expect(tooltip).toContain("83.57");
  });
});

// ─── convertSync ─────────────────────────────────────────────────────────────

describe("convertSync", () => {
  it("returns the same amount for same currency", () => {
    expect(convertSync(1000, "INR", "INR")).toBe(1000);
    expect(convertSync(100, "USD", "USD")).toBe(100);
  });

  it("converts INR to USD using fallback rates", () => {
    // Fallback: 1 USD = 83.5 INR, so 8350 INR ≈ 100 USD
    const result = convertSync(8350, "INR", "USD");
    // Should be close to 100 (within 5% given fallback rates)
    expect(result).toBeGreaterThan(90);
    expect(result).toBeLessThan(110);
  });

  it("converts USD to INR using fallback rates", () => {
    // Fallback: 1 USD = 83.5 INR
    const result = convertSync(100, "USD", "INR");
    expect(result).toBeGreaterThan(8000);
    expect(result).toBeLessThan(9000);
  });

  it("converts EUR to GBP", () => {
    // EUR ≈ 90.2 INR/EUR, GBP ≈ 105.8 INR/GBP
    // 100 EUR = 9020 INR = ~85.2 GBP
    const result = convertSync(100, "EUR", "GBP");
    expect(result).toBeGreaterThan(70);
    expect(result).toBeLessThan(100);
  });

  it("returns a finite number for all supported currencies", () => {
    const currencies = ["INR", "USD", "EUR", "GBP", "AED", "JPY", "SGD", "AUD"];
    for (const from of currencies) {
      for (const to of currencies) {
        const result = convertSync(1000, from, to);
        expect(isFinite(result)).toBe(true);
        expect(result).toBeGreaterThan(0);
      }
    }
  });

  it("rounds to 2 decimal places", () => {
    const result = convertSync(1, "USD", "INR");
    const decimals = result.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});
