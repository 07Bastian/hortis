import { describe, expect, it } from "vitest";
import { suggestRotation } from "./suggestRotation.js";

describe("suggestRotation", () => {
  it("suggests legumes after fruit/solanaceae history", () => {
    const suggestions = suggestRotation({
      bedId: "bed-1",
      year: 2026,
      widthCells: 4,
      heightCells: 2,
      step: 2,
      history: [
        {
          id: "p1",
          bedId: "bed-1",
          name: "Tomate",
          family: "solanaceae",
          x: 0,
          y: 0,
          w: 2,
          h: 2,
          year: 2025,
        },
      ],
      seeds: [{ id: "s1", name: "Erbse", family: "fabaceae", nameDe: "Früh Erbse" }],
    });
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].cropGroup).toBe("legume");
    expect(suggestions[0].seedId).toBe("s1");
  });

  it("avoids same family within 3 years", () => {
    const suggestions = suggestRotation({
      bedId: "bed-1",
      year: 2026,
      widthCells: 2,
      heightCells: 2,
      step: 2,
      history: [
        {
          id: "p1",
          bedId: "bed-1",
          name: "Bohne",
          family: "fabaceae",
          x: 0,
          y: 0,
          w: 2,
          h: 2,
          year: 2024,
        },
      ],
    });
    for (const s of suggestions) {
      expect(s.family).not.toBe("fabaceae");
    }
  });
});
