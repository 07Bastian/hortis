import { CULTIVARS, type Cultivar, type RotationCropGroup } from "./cultivars.js";
import { normalizeFamily } from "./companions.js";
import type { PlantingLike } from "./rotation.js";

const CYCLE: RotationCropGroup[] = ["legume", "leaf", "fruit", "root"];

export interface SeedLike {
  id?: string;
  name: string;
  nameDe?: string;
  nameEn?: string;
  nameLatin?: string;
  family: string;
  cultivarId?: string | null;
  cropGroup?: RotationCropGroup;
}

export interface RotationSuggestion {
  bedId: string;
  year: number;
  x: number;
  y: number;
  w: number;
  h: number;
  cropGroup: RotationCropGroup;
  family: string;
  name: string;
  nameDe: string;
  nameEn: string;
  nameLatin: string;
  cultivarId: string | null;
  seedId: string | null;
  score: number;
  reason: string;
}

function groupOf(family: string, cultivar?: Cultivar): RotationCropGroup {
  if (cultivar) return cultivar.cropGroup;
  const f = normalizeFamily(family);
  if (f === "fabaceae") return "legume";
  if (["solanaceae", "cucurbitaceae"].includes(f)) return "fruit";
  if (["alliaceae"].includes(f)) return "root";
  if (["apiaceae"].includes(f)) return "root";
  if (["brassicaceae", "asteraceae", "lamiaceae", "amaranthaceae"].includes(f)) return "leaf";
  return "other";
}

function nextGroup(prev: RotationCropGroup): RotationCropGroup {
  const i = CYCLE.indexOf(prev);
  if (i < 0) return "legume";
  return CYCLE[(i + 1) % CYCLE.length];
}

function blockedFamilies(history: PlantingLike[], bedId: string, x: number, y: number, year: number): Set<string> {
  const blocked = new Set<string>();
  for (const p of history) {
    if (p.bedId !== bedId) continue;
    if (year - p.year < 1 || year - p.year > 3) continue;
    if (x < p.x || x >= p.x + p.w || y < p.y || y >= p.y + p.h) continue;
    blocked.add(normalizeFamily(p.family || p.name));
  }
  return blocked;
}

function lastGroup(
  history: PlantingLike[],
  bedId: string,
  x: number,
  y: number,
  year: number,
): RotationCropGroup | null {
  let best: PlantingLike | null = null;
  for (const p of history) {
    if (p.bedId !== bedId) continue;
    if (p.year >= year) continue;
    if (x < p.x || x >= p.x + p.w || y < p.y || y >= p.y + p.h) continue;
    if (!best || p.year > best.year) best = p;
  }
  if (!best) return null;
  const cult = CULTIVARS.find(
    (c) =>
      c.nameDe.toLowerCase() === best!.name.toLowerCase() ||
      normalizeFamily(c.family) === normalizeFamily(best!.family),
  );
  return groupOf(best.family || best.name, cult);
}

function pickCandidate(
  target: RotationCropGroup,
  blocked: Set<string>,
  seeds: SeedLike[],
): { name: string; nameDe: string; nameEn: string; nameLatin: string; family: string; cultivarId: string | null; seedId: string | null; score: number } | null {
  const fromSeeds = seeds.filter((s) => {
    const fam = normalizeFamily(s.family);
    if (blocked.has(fam)) return false;
    const cult = s.cultivarId ? CULTIVARS.find((c) => c.id === s.cultivarId) : undefined;
    const g = s.cropGroup ?? groupOf(s.family, cult);
    return g === target;
  });
  if (fromSeeds[0]) {
    const s = fromSeeds[0];
    return {
      name: s.nameDe || s.name,
      nameDe: s.nameDe || s.name,
      nameEn: s.nameEn || s.name,
      nameLatin: s.nameLatin || s.name,
      family: normalizeFamily(s.family),
      cultivarId: s.cultivarId ?? null,
      seedId: s.id ?? null,
      score: 90,
    };
  }
  const fromCat = CULTIVARS.filter(
    (c) => c.cropGroup === target && !blocked.has(normalizeFamily(c.family)),
  );
  if (!fromCat[0]) return null;
  const c = fromCat[0];
  return {
    name: c.nameDe,
    nameDe: c.nameDe,
    nameEn: c.nameEn,
    nameLatin: c.nameLatin,
    family: c.family,
    cultivarId: c.id,
    seedId: null,
    score: 70,
  };
}

export function suggestRotation(input: {
  bedId: string;
  year: number;
  widthCells: number;
  heightCells: number;
  history: PlantingLike[];
  seeds?: SeedLike[];
  /** Sample every N cells to avoid huge grids */
  step?: number;
}): RotationSuggestion[] {
  const step = Math.max(1, input.step ?? 2);
  const seeds = input.seeds ?? [];
  const out: RotationSuggestion[] = [];

  for (let y = 0; y < input.heightCells; y += step) {
    for (let x = 0; x < input.widthCells; x += step) {
      const blocked = blockedFamilies(input.history, input.bedId, x, y, input.year);
      const prev = lastGroup(input.history, input.bedId, x, y, input.year);
      const target = nextGroup(prev ?? "root");
      const pick = pickCandidate(target, blocked, seeds);
      if (!pick) continue;
      const reason = prev
        ? `Nach ${prev} → ${target} (Zyklus); Familie ${pick.family} frei (≥3 Jahre).`
        : `Startvorschlag ${target}; ${pick.seedId ? "aus Besitz" : "aus Katalog"}.`;
      out.push({
        bedId: input.bedId,
        year: input.year,
        x,
        y,
        w: Math.min(step, input.widthCells - x),
        h: Math.min(step, input.heightCells - y),
        cropGroup: target,
        family: pick.family,
        name: pick.name,
        nameDe: pick.nameDe,
        nameEn: pick.nameEn,
        nameLatin: pick.nameLatin,
        cultivarId: pick.cultivarId,
        seedId: pick.seedId,
        score: pick.score + (prev ? 5 : 0),
        reason,
      });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}
