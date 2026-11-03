import type { FastifyInstance } from "fastify";
import { bedSchema, plantingSchema, seedSchema } from "@hortis/shared";
import {
  companionWarnings,
  harvestBlockedUntil,
  layoutScore,
  rotationWarnings,
  searchCultivars,
  suggestRotation,
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
    const d = parsed.data;
    const nameDe = d.nameDe || d.name;
    db.prepare(
      `INSERT INTO seeds (
         id, name, species, family, quantity, unit, year_harvested, notes,
         name_de, name_en, name_latin, license, purchased_at, propagated_at,
         generation, parent_seed_id, cultivar_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      d.name,
      d.species || d.nameLatin,
      d.family,
      d.quantity,
      d.unit,
      d.yearHarvested ?? null,
      d.notes,
      nameDe,
      d.nameEn,
      d.nameLatin || d.species,
      d.license,
      d.purchasedAt ?? null,
      d.propagatedAt ?? null,
      d.generation,
      d.parentSeedId ?? null,
      d.cultivarId ?? null,
    );
    const row = db.prepare(`SELECT * FROM seeds WHERE id = ?`).get(id);
    return { seed: mapSeed(row as Record<string, unknown>) };
  });

  app.post("/api/seeds/:id/propagate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const cur = db.prepare(`SELECT * FROM seeds WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!cur) return reply.code(404).send({ error: "Not found" });
    const mapped = mapSeed(cur);
    const newId = uid();
    const now = new Date().toISOString().slice(0, 10);
    const gen = mapped.generation + 1;
    db.prepare(
      `INSERT INTO seeds (
         id, name, species, family, quantity, unit, year_harvested, notes,
         name_de, name_en, name_latin, license, purchased_at, propagated_at,
         generation, parent_seed_id, cultivar_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      newId,
      `${mapped.name} G${gen}`,
      mapped.species,
      mapped.family,
      1,
      mapped.unit,
      new Date().getFullYear(),
      `Vermehrt aus ${mapped.id}`,
      mapped.nameDe,
      mapped.nameEn,
      mapped.nameLatin,
      mapped.license === "f1" ? "unknown" : mapped.license,
      null,
      now,
      gen,
      id,
      mapped.cultivarId,
    );
    const row = db.prepare(`SELECT * FROM seeds WHERE id = ?`).get(newId);
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
    const p = parsed.data;
    db.prepare(
      `UPDATE seeds SET name=?, species=?, family=?, quantity=?, unit=?, year_harvested=?, notes=?,
       name_de=?, name_en=?, name_latin=?, license=?, purchased_at=?, propagated_at=?,
       generation=?, parent_seed_id=?, cultivar_id=? WHERE id=?`,
    ).run(
      asSql(p.name ?? cur.name),
      asSql(p.species ?? cur.species),
      asSql(p.family ?? cur.family),
      asSql(p.quantity ?? cur.quantity),
      asSql(p.unit ?? cur.unit),
      asSql(p.yearHarvested === undefined ? cur.year_harvested : p.yearHarvested),
      asSql(p.notes ?? cur.notes),
      asSql(p.nameDe ?? cur.name_de),
      asSql(p.nameEn ?? cur.name_en),
      asSql(p.nameLatin ?? cur.name_latin),
      asSql(p.license ?? cur.license),
      asSql(p.purchasedAt === undefined ? cur.purchased_at : p.purchasedAt),
      asSql(p.propagatedAt === undefined ? cur.propagated_at : p.propagatedAt),
      asSql(p.generation ?? cur.generation),
      asSql(p.parentSeedId === undefined ? cur.parent_seed_id : p.parentSeedId),
      asSql(p.cultivarId === undefined ? cur.cultivar_id : p.cultivarId),
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

  app.get("/api/cultivars", async (request) => {
    const { q } = request.query as { q?: string };
    return { cultivars: searchCultivars(q || "", 80) };
  });

  app.get("/api/garden/rotation-suggest", async (request, reply) => {
    const { bedId, year } = request.query as { bedId?: string; year?: string };
    if (!bedId) return reply.code(400).send({ error: "bedId required" });
    const y = year ? Number(year) : new Date().getFullYear();
    const bed = db.prepare(`SELECT * FROM beds WHERE id = ?`).get(bedId) as
      | Record<string, unknown>
      | undefined;
    if (!bed) return reply.code(404).send({ error: "Bed not found" });
    const history = db
      .prepare(`SELECT * FROM plantings WHERE bed_id = ? AND year < ?`)
      .all(bedId, y)
      .map((r) => mapPlanting(r as Record<string, unknown>));
    const seeds = db
      .prepare(`SELECT * FROM seeds`)
      .all()
      .map((r) => mapSeed(r as Record<string, unknown>));
    const mappedBed = mapBed(bed);
    const suggestions = suggestRotation({
      bedId,
      year: y,
      widthCells: mappedBed.widthCells,
      heightCells: mappedBed.heightCells,
      history,
      seeds,
      step: 2,
    });
    return { year: y, bedId, suggestions };
  });
}
