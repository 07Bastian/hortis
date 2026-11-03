/** Simplified Kamerplanter-inspired phase + harvest safety (Karenz days). */
export type GrowPhase = "planned" | "seeded" | "growing" | "harvest" | "done";

const PHASE_ORDER: GrowPhase[] = [
  "planned",
  "seeded",
  "growing",
  "harvest",
  "done",
];

export function canAdvance(from: GrowPhase, to: GrowPhase): boolean {
  return PHASE_ORDER.indexOf(to) >= PHASE_ORDER.indexOf(from);
}

/** Days after pest treatment before harvest is allowed. */
export function harvestBlockedUntil(
  lastPestTreatmentAt: string | null,
  karenzDays = 14,
  now = new Date(),
): { blocked: boolean; until: string | null } {
  if (!lastPestTreatmentAt) return { blocked: false, until: null };
  const until = new Date(
    new Date(lastPestTreatmentAt).getTime() + karenzDays * 86400000,
  );
  return {
    blocked: until.getTime() > now.getTime(),
    until: until.toISOString(),
  };
}
