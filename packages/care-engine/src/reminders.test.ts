import { describe, expect, it } from "vitest";
import { computeReminderStatus, defaultIntervalDays } from "./reminders.js";

describe("reminders", () => {
  it("marks overdue watering", () => {
    const now = new Date("2026-06-10T12:00:00.000Z");
    const status = computeReminderStatus(
      {
        id: "1",
        plantId: "p1",
        eventType: "water",
        intervalDays: 3,
        rainAware: false,
        active: true,
      },
      [
        {
          id: "e1",
          plantId: "p1",
          eventType: "water",
          note: "",
          photoPath: null,
          performedAt: "2026-06-01T12:00:00.000Z",
          performedBy: null,
        },
      ],
      now,
      0,
    );
    expect(status.overdueDays).toBeGreaterThan(0);
  });

  it("suppresses water reminder when rain-aware", () => {
    const now = new Date("2026-06-05T12:00:00.000Z");
    const status = computeReminderStatus(
      {
        id: "1",
        plantId: "p1",
        eventType: "water",
        intervalDays: 3,
        rainAware: true,
        active: true,
      },
      [
        {
          id: "e1",
          plantId: "p1",
          eventType: "water",
          note: "",
          photoPath: null,
          performedAt: "2026-06-01T12:00:00.000Z",
          performedBy: null,
        },
      ],
      now,
      5,
    );
    expect(status.suppressedByRain).toBe(true);
    expect(status.overdueDays).toBe(0);
  });

  it("has defaults", () => {
    expect(defaultIntervalDays("water")).toBe(4);
  });
});
