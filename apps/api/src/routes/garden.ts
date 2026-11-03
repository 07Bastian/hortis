import type { FastifyInstance } from "fastify";
import { bedSchema, plantingSchema, seedSchema } from "@hortis/shared";
import {
  companionWarnings,
  harvestBlockedUntil,
  layoutScore,
  rotationWarnings,
} from "@hortis/garden-engine";
import { db, uid } from "../db.js";
import { requireAuth } from "../auth/guard.js";
import { asSql, mapBed, mapPlanting, mapSeed } from "../mappers.js";

export async function gardenRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireAuth);

  app.get("/api/beds", async () => {
    const rows = db.prepare(`SELECT * FROM beds ORDER BY year DESC, name`).all();
    return { beds: rows.map((r) => mapBed(r as Record<string, unknown>)) };
  });

  app.post("/api/beds", async (request, reply) => {
    const parsed = bedSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const id = uid();
    db.prepare(
      `INSERT INTO beds (id, name, width_cells, height_cells, year, notes) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.data.name,
      parsed.data.widthCells,
      parsed.data.heightCells,
      parsed.data.year,
      parsed.data.notes,
    );
    const row = db.prepare(`SELECT * FROM beds WHERE id = ?`).get(id);
    return { bed: mapBed(row as Record<string, unknown>) };
  });

  app.delete("/api/beds/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare(`DELETE FROM beds WHERE id = ?`).run(id);
    return reply.code(204).send();
  });

  app.get("/api/seeds", async () => {
    const rows = db.prepare(`SELECT * FROM seeds ORDER BY name`).all();
    return { seeds: rows.map((r) => mapSeed(r as Record<string, unknown>)) };
  });

  app.post("/api/seeds", async (request, reply) => {
    const parsed = seedSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const id = uid();
    db.prepare(
      `INSERT INTO seeds (id, name, species, family, quantity, unit, year_harvested, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.data.name,
      parsed.data.species,
      parsed.data.family,
      parsed.data.quantity,
      parsed.data.unit,
      parsed.data.yearHarvested ?? null,
      parsed.data.notes,
    );
    const row = db.prepare(`SELECT * FROM seeds WHERE id = ?`).get(id);
    return { seed: mapSeed(row as Record<string, unknown>) };
  });

  app.patch("/api/seeds/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = seedSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const cur = db.prepare(`SELECT * FROM seeds WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!cur) return reply.code(404).send({ error: "Not found" });
    db.prepare(
      `UPDATE seeds SET name=?, species=?, family=?, quantity=?, unit=?, year_harvested=?, notes=? WHERE id=?`,
    ).run(
      asSql(parsed.data.name ?? cur.name),
      asSql(parsed.data.species ?? cur.species),
      asSql(parsed.data.family ?? cur.family),
      asSql(parsed.data.quantity ?? cur.quantity),
      asSql(parsed.data.unit ?? cur.unit),
      asSql(
        parsed.data.yearHarvested === undefined ? cur.year_harvested : parsed.data.yearHarvested,
      ),
      asSql(parsed.data.notes ?? cur.notes),
      id,
    );
    const row = db.prepare(`SELECT * FROM seeds WHERE id = ?`).get(id);
    return { seed: mapSeed(row as Record<string, unknown>) };
  });

  app.delete("/api/seeds/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare(`DELETE FROM seeds WHERE id = ?`).run(id);
    return reply.code(204).send();
  });

  app.get("/api/plantings", async (request) => {
    const { bedId, year } = request.query as { bedId?: string; year?: string };
    let rows: unknown[];
    if (bedId && year) {
      rows = db
        .prepare(`SELECT * FROM plantings WHERE bed_id = ? AND year = ?`)
        .all(bedId, Number(year));
    } else if (bedId) {
      rows = db.prepare(`SELECT * FROM plantings WHERE bed_id = ?`).all(bedId);
    } else {
      rows = db.prepare(`SELECT * FROM plantings`).all();
    }
    return { plantings: rows.map((r) => mapPlanting(r as Record<string, unknown>)) };
  });

  app.post("/api/plantings", async (request, reply) => {
    const parsed = plantingSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const id = uid();
    db.prepare(
      `INSERT INTO plantings
        (id, bed_id, seed_id, name, family, x, y, w, h, year, planted_at, phase)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.data.bedId,
      parsed.data.seedId ?? null,
      parsed.data.name,
      parsed.data.family,
      parsed.data.x,
      parsed.data.y,
      parsed.data.w,
      parsed.data.h,
      parsed.data.year,
      parsed.data.plantedAt ?? null,
      parsed.data.phase,
    );
    const row = db.prepare(`SELECT * FROM plantings WHERE id = ?`).get(id);
    return { planting: mapPlanting(row as Record<string, unknown>) };
  });

  app.patch("/api/plantings/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = plantingSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const cur = db.prepare(`SELECT * FROM plantings WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!cur) return reply.code(404).send({ error: "Not found" });

    if (parsed.data.phase === "harvest") {
      const lastPest = db
        .prepare(
          `SELECT performed_at FROM care_events
           WHERE event_type = 'pest' AND plant_id IN (
             SELECT id FROM plants WHERE name = ?
           )
           ORDER BY performed_at DESC LIMIT 1`,
        )
        .get(asSql(cur.name)) as { performed_at: string } | undefined;
      const block = harvestBlockedUntil(lastPest?.performed_at ?? null);
      if (block.blocked) {
        return reply.code(409).send({
          error: "Harvest blocked by pest treatment Karenz",
          until: block.until,
        });
      }
    }

    db.prepare(
      `UPDATE plantings SET bed_id=?, seed_id=?, name=?, family=?, x=?, y=?, w=?, h=?, year=?, planted_at=?, harvested_at=?, phase=? WHERE id=?`,
    ).run(
      asSql(parsed.data.bedId ?? cur.bed_id),
      asSql(parsed.data.seedId === undefined ? cur.seed_id : parsed.data.seedId),
      asSql(parsed.data.name ?? cur.name),
      asSql(parsed.data.family ?? cur.family),
      asSql(parsed.data.x ?? cur.x),
      asSql(parsed.data.y ?? cur.y),
      asSql(parsed.data.w ?? cur.w),
      asSql(parsed.data.h ?? cur.h),
      asSql(parsed.data.year ?? cur.year),
      asSql(parsed.data.plantedAt === undefined ? cur.planted_at : parsed.data.plantedAt),
      asSql(
        parsed.data.phase === "harvest" || parsed.data.phase === "done"
          ? new Date().toISOString()
          : cur.harvested_at,
      ),
      asSql(parsed.data.phase ?? cur.phase),
      id,
    );
    const row = db.prepare(`SELECT * FROM plantings WHERE id = ?`).get(id);
    return { planting: mapPlanting(row as Record<string, unknown>) };
  });

  app.delete("/api/plantings/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare(`DELETE FROM plantings WHERE id = ?`).run(id);
    return reply.code(204).send();
  });

  app.get("/api/garden/analysis", async (request) => {
    const { bedId, year } = request.query as { bedId?: string; year?: string };
    const y = year ? Number(year) : new Date().getFullYear();
    const current = (
      bedId
        ? db.prepare(`SELECT * FROM plantings WHERE bed_id = ? AND year = ?`).all(bedId, y)
        : db.prepare(`SELECT * FROM plantings WHERE year = ?`).all(y)
    ).map((r) => mapPlanting(r as Record<string, unknown>));
    const history = (
      bedId
        ? db.prepare(`SELECT * FROM plantings WHERE bed_id = ? AND year < ?`).all(bedId, y)
        : db.prepare(`SELECT * FROM plantings WHERE year < ?`).all(y)
    ).map((r) => mapPlanting(r as Record<string, unknown>));

    return {
      year: y,
      score: layoutScore(current),
      rotation: rotationWarnings(current, history),
      companions: companionWarnings(current),
    };
  });
}
