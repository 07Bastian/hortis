import type { FastifyInstance, FastifyRequest } from "fastify";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../auth/guard.js";
import { db, uid } from "../db.js";
import { asSql, mapPlant } from "../mappers.js";
import { getSettings } from "../services/settings.js";

function tokenHash(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

async function maybeAuthToken(request: FastifyRequest): Promise<boolean> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer hortis_")) return false;
  const raw = header.slice("Bearer ".length);
  const row = db
    .prepare(`SELECT id FROM api_tokens WHERE token_hash = ? AND active = 1`)
    .get(tokenHash(raw)) as { id: string } | undefined;
  if (!row) return false;
  db.prepare(`UPDATE api_tokens SET last_used_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    row.id,
  );
  return true;
}

export async function collabRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/search", { preHandler: requireAuth }, async (request) => {
    const { q } = request.query as { q?: string };
    const term = (q || "").trim();
    if (term.length < 1) return { plants: [], tasks: [], seeds: [], inventory: [] };
    const like = `%${term}%`;
    const plants = db
      .prepare(
        `SELECT * FROM plants WHERE archived = 0 AND (
          name LIKE ? OR species LIKE ? OR scientific_name LIKE ? OR notes LIKE ? OR tags_json LIKE ?
        ) LIMIT 30`,
      )
      .all(like, like, like, like, like)
      .map((r) => mapPlant(r as Record<string, unknown>));
    const tasks = db
      .prepare(`SELECT id, title, done, due_at as dueAt FROM tasks WHERE title LIKE ? LIMIT 20`)
      .all(like);
    const seeds = db
      .prepare(`SELECT id, name, family, quantity, unit FROM seeds WHERE name LIKE ? OR family LIKE ? LIMIT 20`)
      .all(like, like);
    const inventory = db
      .prepare(`SELECT id, name, category, quantity, unit FROM inventory WHERE name LIKE ? LIMIT 20`)
      .all(like);
    return { plants, tasks, seeds, inventory };
  });

  app.get("/api/chat", { preHandler: requireAuth }, async (request) => {
    const { limit } = request.query as { limit?: string };
    const lim = Math.min(100, Number(limit) || 40);
    const rows = db
      .prepare(
        `SELECT id, user_id as userId, display_name as displayName, body, created_at as createdAt
         FROM chat_messages ORDER BY created_at DESC LIMIT ?`,
      )
      .all(lim);
    return { messages: (rows as object[]).reverse() };
  });

  app.post("/api/chat", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = z.object({ body: z.string().min(1).max(2000) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const id = uid();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO chat_messages (id, user_id, display_name, body, created_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(id, request.user.id, request.user.displayName, parsed.data.body, createdAt);
    return { message: { id, userId: request.user.id, displayName: request.user.displayName, body: parsed.data.body, createdAt } };
  });

  app.get("/api/calendar", { preHandler: requireAuth }, async (request) => {
    const { from, till } = request.query as { from?: string; till?: string };
    const start = from || new Date().toISOString().slice(0, 10);
    const end =
      till ||
      new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const rows = db
      .prepare(
        `SELECT id, title, class, date_from as dateFrom, date_till as dateTill,
                plant_id as plantId, bed_id as bedId, notes
         FROM calendar_events
         WHERE date_till >= ? AND date_from <= ?
         ORDER BY date_from`,
      )
      .all(start, end);
    return { events: rows, from: start, till: end };
  });

  app.post("/api/calendar", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = z
      .object({
        title: z.string().min(1).max(200),
        class: z.string().max(40).default("general"),
        dateFrom: z.string().min(8).max(40),
        dateTill: z.string().min(8).max(40),
        plantId: z.string().uuid().nullable().optional(),
        bedId: z.string().uuid().nullable().optional(),
        notes: z.string().max(2000).default(""),
      })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const id = uid();
    db.prepare(
      `INSERT INTO calendar_events (id, title, class, date_from, date_till, plant_id, bed_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.data.title,
      parsed.data.class,
      parsed.data.dateFrom,
      parsed.data.dateTill,
      parsed.data.plantId ?? null,
      parsed.data.bedId ?? null,
      parsed.data.notes,
    );
    return { id, ...parsed.data };
  });

  app.delete("/api/calendar/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare(`DELETE FROM calendar_events WHERE id = ?`).run(id);
    return reply.code(204).send();
  });

  app.post("/api/plants/:id/archive", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = db.prepare(`SELECT * FROM plants WHERE id = ?`).get(id);
    if (!row) return reply.code(404).send({ error: "Not found" });
    const reason = (request.body as { reason?: string })?.reason || "archived";
    db.prepare(
      `INSERT INTO plant_history (id, plant_json, reason, archived_at, archived_by) VALUES (?, ?, ?, ?, ?)`,
    ).run(uid(), JSON.stringify(row), reason, new Date().toISOString(), request.user.id);
    db.prepare(`UPDATE plants SET archived = 1, updated_at = ? WHERE id = ?`).run(
      new Date().toISOString(),
      id,
    );
    return { ok: true };
  });

  app.get("/api/history", { preHandler: requireAuth }, async () => {
    const rows = db
      .prepare(
        `SELECT id, reason, archived_at as archivedAt, plant_json as plantJson FROM plant_history
         ORDER BY archived_at DESC LIMIT 100`,
      )
      .all()
      .map((r) => {
        const row = r as { id: string; reason: string; archivedAt: string; plantJson: string };
        const plant = JSON.parse(row.plantJson);
        return {
          id: row.id,
          reason: row.reason,
          archivedAt: row.archivedAt,
          plant: mapPlant(plant),
        };
      });
    return { history: rows };
  });

  app.post("/api/plants/:id/clone", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = db.prepare(`SELECT * FROM plants WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return reply.code(404).send({ error: "Not found" });
    const newId = uid();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO plants (
         id, kind, name, species, location_id, tags_json, notes, photo_path, acquired_at, created_at, updated_at,
         scientific_name, common_name, watering_profile, light_needs, humidity, soil_mix, health_status, origin, price, archived
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).run(
      newId,
      asSql(row.kind),
      `${String(row.name)} (Kopie)`,
      asSql(row.species),
      asSql(row.location_id),
      asSql(row.tags_json),
      asSql(row.notes),
      null,
      now,
      now,
      now,
      asSql(row.scientific_name),
      asSql(row.common_name),
      asSql(row.watering_profile),
      asSql(row.light_needs),
      asSql(row.humidity),
      asSql(row.soil_mix),
      asSql(row.health_status),
      asSql(row.origin),
      asSql(row.price),
    );
    const created = db.prepare(`SELECT * FROM plants WHERE id = ?`).get(newId);
    return { plant: mapPlant(created as Record<string, unknown>) };
  });

  app.post("/api/locations/:id/bulk-care", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = z
      .object({ eventType: z.enum(["water", "fertilize", "mist", "repot"]) })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const plants = db
      .prepare(`SELECT id, name FROM plants WHERE location_id = ? AND archived = 0`)
      .all(id) as { id: string; name: string }[];
    const now = new Date().toISOString();
    const insert = db.prepare(
      `INSERT INTO care_events (id, plant_id, event_type, note, performed_at, performed_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    for (const p of plants) {
      insert.run(uid(), p.id, parsed.data.eventType, "bulk location care", now, request.user.id);
    }
    return { count: plants.length, eventType: parsed.data.eventType };
  });

  app.post("/api/harvest", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = z
      .object({
        plantingId: z.string().uuid().nullable().optional(),
        bedId: z.string().uuid().nullable().optional(),
        name: z.string().min(1).max(160),
        weightG: z.number().min(0).nullable().optional(),
        quality: z.string().max(80).default(""),
        notes: z.string().max(2000).default(""),
        harvestedAt: z.string().datetime().optional(),
      })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const id = uid();
    const harvestedAt = parsed.data.harvestedAt ?? new Date().toISOString();
    db.prepare(
      `INSERT INTO harvest_logs (id, planting_id, bed_id, name, weight_g, quality, notes, harvested_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.data.plantingId ?? null,
      parsed.data.bedId ?? null,
      parsed.data.name,
      parsed.data.weightG ?? null,
      parsed.data.quality,
      parsed.data.notes,
      harvestedAt,
    );
    if (parsed.data.plantingId) {
      db.prepare(
        `UPDATE plantings SET phase = 'harvest', harvested_at = ? WHERE id = ?`,
      ).run(harvestedAt, parsed.data.plantingId);
    }
    return { id, ...parsed.data, harvestedAt };
  });

  app.get("/api/harvest", { preHandler: requireAuth }, async () => {
    const rows = db
      .prepare(
        `SELECT id, planting_id as plantingId, bed_id as bedId, name, weight_g as weightG,
                quality, notes, harvested_at as harvestedAt
         FROM harvest_logs ORDER BY harvested_at DESC LIMIT 100`,
      )
      .all();
    return { harvests: rows };
  });

  app.post("/api/identify", { preHandler: requireAuth }, async (request, reply) => {
    const s = getSettings();
    if (!s.plantNetApiKey) {
      return reply.code(400).send({
        error: "PlantNet API-Key fehlt (Einstellungen → plantNetApiKey)",
      });
    }
    const file = await request.file();
    if (!file) return reply.code(400).send({ error: "image required" });
    const chunks: Buffer[] = [];
    for await (const chunk of file.file) chunks.push(Buffer.from(chunk));
    const buf = Buffer.concat(chunks);
    const form = new FormData();
    const blob = new Blob([new Uint8Array(buf)], {
      type: file.mimetype || "image/jpeg",
    });
    form.append("images", blob, file.filename || "plant.jpg");
    form.append("organs", "auto");
    const res = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(s.plantNetApiKey)}`,
      { method: "POST", body: form },
    );
    if (!res.ok) {
      return reply.code(502).send({ error: `PlantNet ${res.status}`, detail: await res.text() });
    }
    const data = await res.json();
    return { result: data };
  });

  app.get("/api/tokens", { preHandler: requireAdmin }, async () => {
    const rows = db
      .prepare(
        `SELECT id, name, created_at as createdAt, last_used_at as lastUsedAt, active
         FROM api_tokens ORDER BY created_at DESC`,
      )
      .all()
      .map((r) => ({ ...r, active: Boolean((r as { active: number }).active) }));
    return { tokens: rows };
  });

  app.post("/api/tokens", { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = z.object({ name: z.string().min(1).max(80) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const raw = `hortis_${randomBytes(24).toString("hex")}`;
    const id = uid();
    db.prepare(
      `INSERT INTO api_tokens (id, name, token_hash, created_by, created_at, active)
       VALUES (?, ?, ?, ?, ?, 1)`,
    ).run(id, parsed.data.name, tokenHash(raw), request.user.id, new Date().toISOString());
    return { id, name: parsed.data.name, token: raw };
  });

  app.delete("/api/tokens/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare(`UPDATE api_tokens SET active = 0 WHERE id = ?`).run(id);
    return reply.code(204).send();
  });

  /** OlsGrow-style automation hook: external systems can trigger a care event with API token. */
  app.post("/api/hooks/care", async (request, reply) => {
    const ok = await maybeAuthToken(request);
    if (!ok) {
      try {
        await request.jwtVerify();
      } catch {
        return reply.code(401).send({ error: "Unauthorized" });
      }
    }
    const parsed = z
      .object({
        plantId: z.string().uuid(),
        eventType: z.enum(["water", "fertilize", "mist", "pest", "note"]),
        note: z.string().max(500).default("automation"),
      })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const plant = db.prepare(`SELECT id FROM plants WHERE id = ?`).get(parsed.data.plantId);
    if (!plant) return reply.code(404).send({ error: "Plant not found" });
    const id = uid();
    db.prepare(
      `INSERT INTO care_events (id, plant_id, event_type, note, performed_at, performed_by)
       VALUES (?, ?, ?, ?, ?, NULL)`,
    ).run(id, parsed.data.plantId, parsed.data.eventType, parsed.data.note, new Date().toISOString());

    const s = getSettings();
    if (s.automationWebhookUrl) {
      void fetch(s.automationWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "care", ...parsed.data, eventId: id }),
      }).catch(() => undefined);
    }
    return { id, ok: true };
  });
}
