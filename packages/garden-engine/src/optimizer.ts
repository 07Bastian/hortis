import { companionRelation, normalizeFamily } from "./companions.js";
import type { PlantingLike } from "./rotation.js";
import { layoutScore } from "./rotation.js";

export interface OptimizerCrop {
  name: string;
  family: string;
  w?: number;
  h?: number;
}

export interface OptimizeInput {
  bedId: string;
  year: number;
  widthCells: number;
  heightCells: number;
  crops: OptimizerCrop[];
  /** Existing plantings to keep (fit-to-current mode). */
  locked?: PlantingLike[];
  history?: PlantingLike[];
  mode: "fresh" | "fit";
}

export interface OptimizeResult {
  plantings: PlantingLike[];
  score: number;
  attempts: number;
  message: string;
}

function cellsFree(
  width: number,
  height: number,
  placed: PlantingLike[],
  w: number,
  h: number,
): { x: number; y: number }[] {
  const free: { x: number; y: number }[] = [];
  for (let y = 0; y <= height - h; y++) {
    for (let x = 0; x <= width - w; x++) {
      const candidate: PlantingLike = {
        id: "tmp",
        bedId: "",
        name: "",
        family: "",
        x,
        y,
        w,
        h,
        year: 0,
      };
      const hit = placed.some(
        (p) =>
          !(
            candidate.x + candidate.w <= p.x ||
            p.x + p.w <= candidate.x ||
            candidate.y + candidate.h <= p.y ||
            p.y + p.h <= candidate.y
          ),
      );
      if (!hit) free.push({ x, y });
    }
  }
  return free;
}

function scorePlacement(plantings: PlantingLike[], history: PlantingLike[]): number {
  let score = layoutScore(plantings);
  // Prefer diversity of families
  const fams = new Set(plantings.map((p) => normalizeFamily(p.family || p.name)));
  score += Math.min(15, fams.size * 3);
  // Penalize same-family adjacency more
  for (let i = 0; i < plantings.length; i++) {
    for (let j = i + 1; j < plantings.length; j++) {
      const a = plantings[i];
      const b = plantings[j];
      const near =
        Math.abs(a.x - b.x) <= a.w && Math.abs(a.y - b.y) <= a.h;
      if (!near) continue;
      const rel = companionRelation(
        normalizeFamily(a.family || a.name),
        normalizeFamily(b.family || b.name),
      );
      if (rel === "good") score += 4;
      if (rel === "bad") score -= 10;
    }
  }
  // Light rotation penalty vs history same cells
  for (const p of plantings) {
    for (const past of history) {
      if (past.bedId !== p.bedId) continue;
      if (p.year - past.year < 1 || p.year - past.year > 3) continue;
      const overlap = !(
        p.x + p.w <= past.x ||
        past.x + past.w <= p.x ||
        p.y + p.h <= past.y ||
        past.y + past.h <= p.y
      );
      if (
        overlap &&
        normalizeFamily(p.family || p.name) === normalizeFamily(past.family || past.name)
      ) {
        score -= 12;
      }
    }
  }
  return score;
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deterministic PRNG for reproducible-ish runs. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Beet Anything–style layout optimizer:
 * randomize crop order + placement, keep best companion/rotation score.
 */
export function optimizeLayout(input: OptimizeInput, seed = 42): OptimizeResult {
  const rnd = mulberry32(seed);
  const locked = input.mode === "fit" ? [...(input.locked || [])] : [];
  const history = input.history || [];
  let best: PlantingLike[] = [...locked];
  let bestScore = -Infinity;
  const attempts = 80;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const placed: PlantingLike[] = [...locked];
    const crops = shuffle(input.crops, rnd);
    for (const crop of crops) {
      const w = Math.max(1, crop.w ?? 1);
      const h = Math.max(1, crop.h ?? 1);
      const spots = cellsFree(input.widthCells, input.heightCells, placed, w, h);
      if (spots.length === 0) continue;
      // Prefer spots next to good companions
      let bestSpot = spots[Math.floor(rnd() * spots.length)];
      let spotScore = -Infinity;
      for (const spot of spots.slice(0, Math.min(spots.length, 24))) {
        const trial: PlantingLike = {
          id: `opt-${attempt}-${placed.length}`,
          bedId: input.bedId,
          name: crop.name,
          family: crop.family,
          x: spot.x,
          y: spot.y,
          w,
          h,
          year: input.year,
        };
        const s = scorePlacement([...placed, trial], history);
        if (s > spotScore) {
          spotScore = s;
          bestSpot = spot;
        }
      }
      placed.push({
        id: `opt-${Date.now()}-${placed.length}-${attempt}`,
        bedId: input.bedId,
        name: crop.name,
        family: crop.family,
        x: bestSpot.x,
        y: bestSpot.y,
        w,
        h,
        year: input.year,
      });
    }
    const sc = scorePlacement(placed, history);
    if (sc > bestScore) {
      bestScore = sc;
      best = placed;
    }
  }

  return {
    plantings: best.filter((p) => !locked.some((l) => l.id === p.id)),
    score: Math.max(0, Math.min(100, Math.round(bestScore))),
    attempts,
    message:
      input.mode === "fresh"
        ? "Frischplan: beste zufällige Mischkultur-/Fruchtfolge-Anordnung."
        : "Fit-to-current: neue Kulturen um bestehende herum optimiert.",
  };
}
