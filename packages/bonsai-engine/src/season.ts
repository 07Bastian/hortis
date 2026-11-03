import type { BonsaiPhase, CareEventType } from "@hortis/shared";

export interface SeasonalTask {
  month: number;
  eventType: CareEventType;
  title: string;
  phases: BonsaiPhase[];
}

/** Typical temperate-climate bonsai year cycle. */
export const SEASONAL_TASKS: SeasonalTask[] = [
  { month: 2, eventType: "prune", title: "Struktur-/Winterschnitt", phases: ["training", "refinement", "display"] },
  { month: 3, eventType: "repot", title: "Umtopfen (Laub)", phases: ["nursery", "training", "refinement"] },
  { month: 4, eventType: "wire", title: "Verdrahten junges Holz", phases: ["training", "refinement"] },
  { month: 5, eventType: "fertilize", title: "Düngen starten", phases: ["nursery", "training", "refinement", "display"] },
  { month: 6, eventType: "prune", title: "Pinzieren / Formschnitt", phases: ["training", "refinement", "display"] },
  { month: 7, eventType: "water", title: "Hitze: Gießen prüfen", phases: ["nursery", "training", "refinement", "display", "recovery"] },
  { month: 8, eventType: "unwire", title: "Draht entfernen / prüfen", phases: ["training", "refinement"] },
  { month: 9, eventType: "fertilize", title: "Herbstdüngung", phases: ["training", "refinement", "display"] },
  { month: 10, eventType: "note", title: "Winterschutz planen", phases: ["nursery", "training", "refinement", "display", "recovery"] },
  { month: 11, eventType: "note", title: "Winterquartier", phases: ["nursery", "training", "refinement", "display", "recovery"] },
];

export function tasksForMonth(month: number, phase: BonsaiPhase): SeasonalTask[] {
  return SEASONAL_TASKS.filter(
    (t) => t.month === month && t.phases.includes(phase),
  );
}

export function wireOverdue(wiredUntil: string | null, now = new Date()): boolean {
  if (!wiredUntil) return false;
  return new Date(wiredUntil).getTime() < now.getTime();
}

export function suggestRepotYears(phase: BonsaiPhase): number {
  if (phase === "nursery") return 1;
  if (phase === "training") return 2;
  if (phase === "recovery") return 1;
  return 3;
}
