/** Growing Degree Days — Kamerplanter-inspired, base °C by crop group. */

export type CropGroup = "cool" | "warm" | "hot" | "default";

const BASE_TEMP: Record<CropGroup, number> = {
  cool: 4,
  warm: 10,
  hot: 13,
  default: 10,
};

/** Typical GDD targets seed→harvest (illustrative temperate values). */
export const GDD_TARGETS: Record<string, { group: CropGroup; target: number }> = {
  salat: { group: "cool", target: 600 },
  möhre: { group: "cool", target: 900 },
  karotte: { group: "cool", target: 900 },
  kohl: { group: "cool", target: 1100 },
  bohnen: { group: "warm", target: 900 },
  tomate: { group: "hot", target: 1400 },
  paprika: { group: "hot", target: 1300 },
  zucchini: { group: "warm", target: 800 },
  gurke: { group: "warm", target: 900 },
  mais: { group: "hot", target: 1500 },
  default: { group: "default", target: 1000 },
};

export function dailyGdd(tMinC: number, tMaxC: number, baseC: number): number {
  const avg = (tMinC + tMaxC) / 2;
  return Math.max(0, avg - baseC);
}

export function accumulateGdd(
  days: { tMinC: number; tMaxC: number }[],
  group: CropGroup = "default",
): number {
  const base = BASE_TEMP[group];
  return days.reduce((sum, d) => sum + dailyGdd(d.tMinC, d.tMaxC, base), 0);
}

export function resolveCropMeta(name: string): { group: CropGroup; target: number } {
  const key = name.trim().toLowerCase();
  for (const [k, v] of Object.entries(GDD_TARGETS)) {
    if (key.includes(k)) return v;
  }
  return GDD_TARGETS.default;
}

export function phaseFromGdd(accumulated: number, target: number): {
  phase: "seeded" | "growing" | "harvest" | "done";
  progress: number;
} {
  const progress = target <= 0 ? 0 : Math.min(1, accumulated / target);
  if (progress < 0.15) return { phase: "seeded", progress };
  if (progress < 0.85) return { phase: "growing", progress };
  if (progress < 1) return { phase: "harvest", progress };
  return { phase: "done", progress: 1 };
}
