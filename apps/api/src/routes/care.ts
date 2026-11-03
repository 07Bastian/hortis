import type { FastifyInstance } from "fastify";
import { careEventSchema, reminderSchema } from "@hortis/shared";
import { computeReminderStatus } from "@hortis/care-engine";
import { db, uid } from "../db.js";
import { requireAuth } from "../auth/guard.js";
import { mapEvent, mapReminder } from "../mappers.js";
import { getRainMmNext24h } from "../services/weather.js";
import { notifyAll } from "../services/notify.js";
import { mapPlant } from "../mappers.js";

export async function careRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireAuth);

  app.get("/api/plants/:id/events", async (request) => {
    const { id } = request.params as { id: string };
    const rows = db
      .prepare(`SELECT * FROM care_events WHERE plant_id = ? ORDER BY performed_at DESC`)
      .all(id);
    return { events: rows.map((r) => mapEvent(r as Record<string, unknown>)) };
  });

  app.post("/api/events", async (request, reply) => {
    const parsed = careEventSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const plant = db.prepare(`SELECT id FROM plants WHERE id = ?`).get(parsed.data.plantId);
    if (!plant) return reply.code(404).send({ error: "Plant not found" });
    const id = uid();
    const performedAt = parsed.data.performedAt ?? new Date().toISOString();
    db.prepare(
      `INSERT INTO care_events (id, plant_id, event_type, note, performed_at, performed_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.data.plantId,
      parsed.data.eventType,
      parsed.data.note,
      performedAt,
      request.user.id,
    );
    const row = db.prepare(`SELECT * FROM care_events WHERE id = ?`).get(id);
    return { event: mapEvent(row as Record<string, unknown>) };
  });

  app.get("/api/reminders", async (request) => {
    const { plantId } = request.query as { plantId?: string };
    const rows = plantId
      ? db.prepare(`SELECT * FROM care_reminders WHERE plant_id = ?`).all(plantId)
      : db.prepare(`SELECT * FROM care_reminders WHERE active = 1`).all();
    return { reminders: rows.map((r) => mapReminder(r as Record<string, unknown>)) };
  });

  app.post("/api/reminders", async (request, reply) => {
    const parsed = reminderSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const id = uid();
    db.prepare(
      `INSERT INTO care_reminders (id, plant_id, event_type, interval_days, rain_aware, active)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.data.plantId,
      parsed.data.eventType,
      parsed.data.intervalDays,
      parsed.data.rainAware ? 1 : 0,
      parsed.data.active ? 1 : 0,
    );
    const row = db.prepare(`SELECT * FROM care_reminders WHERE id = ?`).get(id);
    return { reminder: mapReminder(row as Record<string, unknown>) };
  });

  app.delete("/api/reminders/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare(`DELETE FROM care_reminders WHERE id = ?`).run(id);
    return reply.code(204).send();
  });

  app.get("/api/reminders/status", async () => {
    const rain = await getRainMmNext24h();
    const reminders = db
      .prepare(`SELECT * FROM care_reminders WHERE active = 1`)
      .all()
      .map((r) => mapReminder(r as Record<string, unknown>));
    const events = db
      .prepare(`SELECT * FROM care_events`)
      .all()
      .map((r) => mapEvent(r as Record<string, unknown>));
    const statuses = reminders.map((reminder) =>
      computeReminderStatus(reminder, events, new Date(), rain),
    );
    return { rainMmNext24h: rain, statuses };
  });

  app.post("/api/reminders/digest", async () => {
    const rain = await getRainMmNext24h();
    const reminders = db
      .prepare(`SELECT * FROM care_reminders WHERE active = 1`)
      .all()
      .map((r) => mapReminder(r as Record<string, unknown>));
    const events = db
      .prepare(`SELECT * FROM care_events`)
      .all()
      .map((r) => mapEvent(r as Record<string, unknown>));
    const overdue = reminders
      .map((reminder) => computeReminderStatus(reminder, events, new Date(), rain))
      .filter((s) => s.overdueDays > 0);
    if (overdue.length === 0) {
      return { sent: false, count: 0 };
    }
    const lines = overdue.map((s) => {
      const plant = db.prepare(`SELECT * FROM plants WHERE id = ?`).get(s.reminder.plantId);
      const name = plant
        ? mapPlant(plant as Record<string, unknown>).name
        : s.reminder.plantId;
      return `• ${name}: ${s.reminder.eventType} (${s.overdueDays}d)`;
    });
    await notifyAll("Pflege fällig", lines.join("\n"));
    return { sent: true, count: overdue.length };
  });
}
