import { companionRelation, normalizeFamily } from "./companions.js";

export interface PlantingLike {
  id: string;
  bedId: string;
  name: string;
  family: string;
  x: number;
  y: number;
  w: number;
  h: number;
  year: number;
}

export interface RotationWarning {
  plantingId: string;
  severity: "warn" | "error";
  message: string;
}

function overlaps(
  a: PlantingLike,
  b: PlantingLike,
): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

/** Crop rotation: same family in same bed cells within 3 years → warning. */
export function rotationWarnings(
  current: PlantingLike[],
  history: PlantingLike[],
): RotationWarning[] {
  const warnings: RotationWarning[] = [];
  for (const plant of current) {
    const fam = normalizeFamily(plant.family || plant.name);
    for (const past of history) {
      if (past.bedId !== plant.bedId) continue;
      if (plant.year - past.year < 1 || plant.year - past.year > 3) continue;
      if (!overlaps(plant, past)) continue;
      const pastFam = normalizeFamily(past.family || past.name);
      if (fam && fam === pastFam) {
        warnings.push({
          plantingId: plant.id,
          severity: "error",
          message: `Fruchtfolge: ${plant.name} folgt auf ${past.name} (${past.year}) derselben Familie (${fam}).`,
        });
      }
    }
  }
  return warnings;
}

export interface CompanionWarning {
  aId: string;
  bId: string;
  relation: "good" | "bad";
  message: string;
}

export function companionWarnings(plantings: PlantingLike[]): CompanionWarning[] {
  const out: CompanionWarning[] = [];
  for (let i = 0; i < plantings.length; i++) {
    for (let j = i + 1; j < plantings.length; j++) {
      const a = plantings[i];
      const b = plantings[j];
      if (a.bedId !== b.bedId || a.year !== b.year) continue;
      const near =
        Math.abs(a.x - b.x) <= a.w + 1 && Math.abs(a.y - b.y) <= a.h + 1;
      if (!near && !overlaps(a, b)) continue;
      const rel = companionRelation(
        normalizeFamily(a.family || a.name),
        normalizeFamily(b.family || b.name),
      );
      if (rel === "neutral") continue;
      out.push({
        aId: a.id,
        bId: b.id,
        relation: rel,
        message:
          rel === "good"
            ? `Mischkultur gut: ${a.name} + ${b.name}`
            : `Mischkultur schlecht: ${a.name} + ${b.name}`,
      });
    }
  }
  return out;
}

/** Beet Anything style layout score (0–100). */
export function layoutScore(plantings: PlantingLike[]): number {
  if (plantings.length === 0) return 100;
  const comps = companionWarnings(plantings);
  const good = comps.filter((c) => c.relation === "good").length;
  const bad = comps.filter((c) => c.relation === "bad").length;
  const raw = 70 + good * 8 - bad * 15;
  return Math.max(0, Math.min(100, raw));
}
