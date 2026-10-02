import { describe, it, expect } from "vitest";
import { scoreRoute, type RouteInput } from "@/lib/route-scorer";

const baseRoute: RouteInput = {
  durationMinutes: 300,
  distanceKm: 500,
  cost: 4000,
  carbonKg: 40,
  walkingKm: 1,
  transfers: 1,
  weatherSeverity: 0,
  accessible: true,
  scenic: false,
};

describe("scoreRoute", () => {
  it("returns a total score between 0 and 100", () => {
    const result = scoreRoute(baseRoute, "fastest");
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it("includes mode in the result", () => {
    const result = scoreRoute(baseRoute, "cheapest");
    expect(result.mode).toBe("cheapest");
  });

  it("includes all six breakdown factors", () => {
    const result = scoreRoute(baseRoute, "eco");
    expect(result.breakdown).toHaveProperty("time");
    expect(result.breakdown).toHaveProperty("cost");
    expect(result.breakdown).toHaveProperty("carbon");
    expect(result.breakdown).toHaveProperty("comfort");
    expect(result.breakdown).toHaveProperty("accessibility");
    expect(result.breakdown).toHaveProperty("scenicness");
  });

  it("eco mode gives higher weight to carbon — lower carbon route scores better", () => {
    const highCarbonRoute: RouteInput = { ...baseRoute, carbonKg: 150 };
    const lowCarbonRoute: RouteInput  = { ...baseRoute, carbonKg: 10 };
    const highScore = scoreRoute(lowCarbonRoute, "eco").total;
    const lowScore  = scoreRoute(highCarbonRoute, "eco").total;
    expect(highScore).toBeGreaterThan(lowScore);
  });

  it("fastest mode favours shorter duration", () => {
    const fastRoute = { ...baseRoute, durationMinutes: 60 };
    const slowRoute = { ...baseRoute, durationMinutes: 600 };
    expect(scoreRoute(fastRoute, "fastest").total).toBeGreaterThan(
      scoreRoute(slowRoute, "fastest").total
    );
  });

  it("accessible mode gives full accessibility score to accessible route", () => {
    const accessibleRoute = { ...baseRoute, accessible: true };
    const inaccessibleRoute = { ...baseRoute, accessible: false };
    expect(scoreRoute(accessibleRoute, "accessible").breakdown.accessibility).toBe(100);
    expect(scoreRoute(inaccessibleRoute, "accessible").breakdown.accessibility).toBe(0);
  });

  it("scenic mode scores scenic route higher", () => {
    const scenicRoute = { ...baseRoute, scenic: true };
    const plainRoute  = { ...baseRoute, scenic: false };
    expect(scoreRoute(scenicRoute, "scenic").total).toBeGreaterThan(
      scoreRoute(plainRoute, "scenic").total
    );
  });

  it("comfortable mode penalises many transfers", () => {
    const fewTransfers  = { ...baseRoute, transfers: 0 };
    const manyTransfers = { ...baseRoute, transfers: 5 };
    expect(scoreRoute(fewTransfers, "comfortable").total).toBeGreaterThan(
      scoreRoute(manyTransfers, "comfortable").total
    );
  });

  it("produces a non-empty recommendation string", () => {
    const result = scoreRoute(baseRoute, "fastest");
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});
