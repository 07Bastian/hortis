import { describe, expect, it } from "vitest";
import { optimizeLayout } from "./optimizer.js";
import { accumulateGdd, dailyGdd, phaseFromGdd } from "./gdd.js";
import { planMix } from "./nutrients.js";

describe("optimizer", () => {
  it("places crops and returns a score", () => {
    const result = optimizeLayout(
      {
        bedId: "bed-1",
        year: 2026,
        widthCells: 6,
        heightCells: 4,
        crops: [
          { name: "Tomate", family: "solanaceae" },
          { name: "Basilikum", family: "lamiaceae" },
          { name: "Bohne", family: "fabaceae" },
        ],
        mode: "fresh",
      },
      7,
    );
    expect(result.plantings.length).toBe(3);
    expect(result.score).toBeGreaterThan(0);
  });
});

describe("gdd", () => {
  it("computes daily and phase", () => {
    expect(dailyGdd(10, 20, 10)).toBe(5);
    const acc = accumulateGdd(
      [
        { tMinC: 12, tMaxC: 22 },
        { tMinC: 14, tMaxC: 24 },
      ],
      "hot",
    );
    expect(acc).toBeGreaterThan(0);
    expect(phaseFromGdd(50, 1000).phase).toBe("seeded");
    expect(phaseFromGdd(900, 1000).phase).toBe("harvest");
  });
});

describe("nutrients", () => {
  it("warns when calmag after sulfate", () => {
    const mix = planMix({
      volumeL: 10,
      targetEc: 1.5,
      sourceEc: 0.2,
      source: "ro",
      saltsG: [
        { name: "Sulfate Mix", grams: 5, order: 1 },
        { name: "CalMag", grams: 3, order: 2 },
      ],
    });
    expect(mix.warnings.some((w) => /CalMag/i.test(w))).toBe(true);
    expect(mix.mixOrder[0]).toMatch(/CalMag/i);
  });
});
