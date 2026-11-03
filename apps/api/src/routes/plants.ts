import type { FastifyInstance } from "fastify";
import { plantSchema, locationSchema } from "@hortis/shared";
import QRCode from "qrcode";
import { db, uid } from "../db.js";
import { requireAuth } from "../auth/guard.js";
import { asSql, mapPlant } from "../mappers.js";

export async function plantRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireAuth);

  app.get("/api/locations", async () => {
    const rows = db
      .prepare(
        `SELECT id, name, kind, notes, sort_order as sortOrder FROM locations ORDER BY sort_order, name`,
      )
      .all();
    return { locations: rows };
  });

  app.post("/api/locations", async (request, reply) => {
    const parsed = locationSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const id = uid();
    db.prepare(
      `INSERT INTO locations (id, name, kind, notes, sort_order) VALUES (?, ?, ?, ?, ?)`,
    ).run(id, parsed.data.name, parsed.data.kind, parsed.data.notes, parsed.data.sortOrder);
    return { id, ...parsed.data };
  });

  app.patch("/api/locations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = locationSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const cur = db.prepare(`SELECT * FROM locations WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!cur) return reply.code(404).send({ error: "Not found" });
    const next = {
      name: parsed.data.name ?? cur.name,
      kind: parsed.data.kind ?? cur.kind,
      notes: parsed.data.notes ?? cur.notes,
      sort_order: parsed.data.sortOrder ?? cur.sort_order,
    };
    db.prepare(
      `UPDATE locations SET name=?, kind=?, notes=?, sort_order=? WHERE id=?`,
    ).run(asSql(next.name), asSql(next.kind), asSql(next.notes), asSql(next.sort_order), id);
    return {
      id,
      name: String(next.name),
      kind: String(next.kind),
      notes: String(next.notes),
      sortOrder: Number(next.sort_order),
    };
  });

  app.delete("/api/locations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare(`DELETE FROM locations WHERE id = ?`).run(id);
    return reply.code(204).send();
  });

  app.get("/api/plants", async (request) => {
    const { kind } = request.query as { kind?: string };
    const rows = kind
      ? db.prepare(`SELECT * FROM plants WHERE kind = ? ORDER BY name`).all(kind)
      : db.prepare(`SELECT * FROM plants ORDER BY name`).all();
    return { plants: rows.map((r) => mapPlant(r as Record<string, unknown>)) };
  });

  app.get("/api/plants/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = db.prepare(`SELECT * FROM plants WHERE id = ?`).get(id);
    if (!row) return reply.code(404).send({ error: "Not found" });
    return { plant: mapPlant(row as Record<string, unknown>) };
  });

  app.post("/api/plants", async (request, reply) => {
    const parsed = plantSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const id = uid();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO plants (
         id, kind, name, species, location_id, tags_json, notes, acquired_at, created_at, updated_at,
         scientific_name, common_name, watering_profile, light_needs, humidity, soil_mix, health_status, origin, price
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.data.kind,
      parsed.data.name,
      parsed.data.species,
      parsed.data.locationId ?? null,
      JSON.stringify(parsed.data.tags),
      parsed.data.notes,
      parsed.data.acquiredAt ?? null,
      now,
      now,
      parsed.data.scientificName,
      parsed.data.commonName,
      parsed.data.wateringProfile,
      parsed.data.lightNeeds,
      parsed.data.humidity,
      parsed.data.soilMix,
      parsed.data.healthStatus,
      parsed.data.origin,
      parsed.data.price ?? null,
    );
    const row = db.prepare(`SELECT * FROM plants WHERE id = ?`).get(id);
    return { plant: mapPlant(row as Record<string, unknown>) };
  });

  app.patch("/api/plants/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = plantSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const cur = db.prepare(`SELECT * FROM plants WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!cur) return reply.code(404).send({ error: "Not found" });
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE plants SET kind=?, name=?, species=?, location_id=?, tags_json=?, notes=?, acquired_at=?, updated_at=?,
        scientific_name=?, common_name=?, watering_profile=?, light_needs=?, humidity=?, soil_mix=?, health_status=?, origin=?, price=?
       WHERE id=?`,
    ).run(
      asSql(parsed.data.kind ?? cur.kind),
      asSql(parsed.data.name ?? cur.name),
      asSql(parsed.data.species ?? cur.species),
      asSql(parsed.data.locationId === undefined ? cur.location_id : parsed.data.locationId),
      JSON.stringify(parsed.data.tags ?? JSON.parse(String(cur.tags_json))),
      asSql(parsed.data.notes ?? cur.notes),
      asSql(parsed.data.acquiredAt === undefined ? cur.acquired_at : parsed.data.acquiredAt),
      now,
      asSql(parsed.data.scientificName ?? cur.scientific_name),
      asSql(parsed.data.commonName ?? cur.common_name),
      asSql(parsed.data.wateringProfile ?? cur.watering_profile),
      asSql(parsed.data.lightNeeds ?? cur.light_needs),
      asSql(parsed.data.humidity ?? cur.humidity),
      asSql(parsed.data.soilMix ?? cur.soil_mix),
      asSql(parsed.data.healthStatus ?? cur.health_status),
      asSql(parsed.data.origin ?? cur.origin),
      asSql(parsed.data.price === undefined ? cur.price : parsed.data.price),
      id,
    );
    const row = db.prepare(`SELECT * FROM plants WHERE id = ?`).get(id);
    return { plant: mapPlant(row as Record<string, unknown>) };
  });

  app.delete("/api/plants/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare(`DELETE FROM plants WHERE id = ?`).run(id);
    return reply.code(204).send();
  });

  app.get("/api/plants/:id/qr", async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = db.prepare(`SELECT id, name FROM plants WHERE id = ?`).get(id) as
      | { id: string; name: string }
      | undefined;
    if (!row) return reply.code(404).send({ error: "Not found" });
    const payload = `hortis:plant:${row.id}`;
    const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 256 });
    return { plantId: row.id, name: row.name, payload, dataUrl };
  });
}
