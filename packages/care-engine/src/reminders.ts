import type { CareEvent, CareEventType, CareReminder } from "@hortis/shared";

export interface ReminderStatus {
  reminder: CareReminder;
  lastEventAt: string | null;
  dueAt: string | null;
  overdueDays: number;
  suppressedByRain: boolean;
}

/** Port of Plant-it / OlsGrow overdue interval logic. */
export function computeReminderStatus(
  reminder: CareReminder,
  events: CareEvent[],
  now = new Date(),
  rainMmNext24h = 0,
): ReminderStatus {
  const matching = events
    .filter((e) => e.plantId === reminder.plantId && e.eventType === reminder.eventType)
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt));

  const last = matching[0] ?? null;
  const lastAt = last ? new Date(last.performedAt) : null;
  const dueAt = lastAt
    ? new Date(lastAt.getTime() + reminder.intervalDays * 86400000)
    : now;

  const overdueMs = now.getTime() - dueAt.getTime();
  const overdueDays = overdueMs > 0 ? Math.floor(overdueMs / 86400000) : 0;
  const suppressedByRain =
    reminder.rainAware &&
    reminder.eventType === "water" &&
    rainMmNext24h >= 3 &&
    overdueDays <= 1;

  return {
    reminder,
    lastEventAt: last?.performedAt ?? null,
    dueAt: dueAt.toISOString(),
    overdueDays: suppressedByRain ? 0 : overdueDays,
    suppressedByRain,
  };
}

export function defaultIntervalDays(eventType: CareEventType): number {
  const map: Record<CareEventType, number> = {
    water: 4,
    fertilize: 21,
    mist: 3,
    prune: 60,
    repot: 365,
    wire: 90,
    unwire: 90,
    harvest: 7,
    pest: 14,
    note: 30,
    photo: 30,
  };
  return map[eventType];
}
