import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, uid } from "../db.js";
import { requireAdmin, requireAuth } from "../auth/guard.js";
import { asSql, mapBed, mapPlant, mapPlanting, mapSeed } from "../mappers.js";

const row = z.record(z.string(), z.unknown());
const snapshotSchema = z.object({
  version: z.literal("hortis-sync-v1"),
  exportedAt: z.string().optional(),
  locations: z.array(row).default([]),
  plants: z.array(row).default([]),
  events: z.array(row).default([]),
  reminders: z.array(row).default([]),
  bonsai: z.array(row).default([]),
  beds: z.array(row).default([]),
  seeds: z.array(row).default([]),
  plantings: z.array(row).default([]),
  inventory: z.array(row).default([]),
  tasks: z.array(row).default([]),
  calendar: z.array(row).default([]),
  harvests: z.array(row).default([]),
  settings: z.record(z.string(), z.unknown()).optional(),
});

function str(v: unknown, fb = ""): string {
  return v == null ? fb : String(v);
}
function num(v: unknown, fb = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/sync/export", { preHandler: requireAuth }, async () => {
    const locations = db.prepare(`SELECT * FROM locations`).all();
    const plants = db
      .prepare(`SELECT * FROM plants`)
      .all()
      .map((r) => mapPlant(r as Record<string, unknown>));
    const events = db.prepare(`SELECT * FROM care_events ORDER BY performed_at DESC`).all();
    const reminders = db.prepare(`SELECT * FROM care_reminders`).all();
    const bonsai = db.prepare(`SELECT * FROM bonsai_profiles`).all();
    const beds = db
      .prepare(`SELECT * FROM beds`)
      .all()
      .map((r) => mapBed(r as Record<string, unknown>));
    const seeds = db
      .prepare(`SELECT * FROM seeds`)
      .all()
      .map((r) => mapSeed(r as Record<string, unknown>));
    const plantings = db
      .prepare(`SELECT * FROM plantings`)
      .all()
      .map((r) => mapPlanting(r as Record<string, unknown>));
    const inventory = db.prepare(`SELECT * FROM inventory`).all();
    const tasks = db.prepare(`SELECT * FROM tasks`).all();
    const calendar = db.prepare(`SELECT * FROM calendar_events`).all();
    const harvests = db.prepare(`SELECT * FROM harvest_logs`).all();
    const settingsRows = db.prepare(`SELECT key, value FROM settings`).all() as {
      key: string;
      value: string;
    }[];
    const settings: Record<string, string> = {};
    for (const s of settingsRows) settings[s.key] = s.value;

    return {
      version: "hortis-sync-v1" as const,
      exportedAt: new Date().toISOString(),
      locations,
      plants,
      events,
      reminders,
      bonsai,
      beds,
      seeds,
      plantings,
      inventory,
      tasks,
      calendar,
      harvests,
      settings,
    };
  });

  app.post("/api/sync/import", { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = snapshotSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const snap = parsed.data;
    let upserted = 0;

    const upsertLocation = db.prepare(
      `INSERT INTO locations (id, name, kind, notes, sort_order)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, kind=excluded.kind, notes=excluded.notes, sort_order=excluded.sort_order`,
    );
    for (const loc of snap.locations) {
      upsertLocation.run(
        str(loc.id, uid()),
        str(loc.name, "Ort"),
        str(loc.kind, "room"),
        str(loc.notes),
        num(loc.sortOrder ?? loc.sort_order),
      );
      upserted++;
    }

    const upsertPlant = db.prepare(
      `INSERT INTO plants (
         id, kind, name, species, location_id, tags_json, notes, photo_path,
         acquired_at, created_at, updated_at, scientific_name, common_name,
         watering_profile, light_needs, humidity, soil_mix, health_status,
         origin, price, archived
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, species=excluded.species, location_id=excluded.location_id,
         tags_json=excluded.tags_json, notes=excluded.notes, updated_at=excluded.updated_at,
         scientific_name=excluded.scientific_name, common_name=excluded.common_name,
         archived=excluded.archived`,
    );
    for (const p of snap.plants) {
      const now = new Date().toISOString();
      const tags = Array.isArray(p.tags) ? JSON.stringify(p.tags) : str(p.tags_json, "[]");
      upsertPlant.run(
        str(p.id, uid()),
        str(p.kind, "indoor"),
        str(p.name, "Pflanze"),
        str(p.species),
        asSql(p.locationId ?? p.location_id ?? null),
        tags,
        str(p.notes),
        asSql(p.photoPath ?? p.photo_path ?? null),
        asSql(p.acquiredAt ?? p.acquired_at ?? null),
        str(p.createdAt ?? p.created_at, now),
        now,
        str(p.scientificName ?? p.scientific_name),
        str(p.commonName ?? p.common_name),
        str(p.wateringProfile ?? p.watering_profile),
        str(p.lightNeeds ?? p.light_needs),
        str(p.humidity),
        str(p.soilMix ?? p.soil_mix),
        str(p.healthStatus ?? p.health_status, "ok"),
        str(p.origin),
        asSql(p.price ?? null),
        p.archived ? 1 : 0,
      );
      upserted++;
    }

    const upsertBed = db.prepare(
      `INSERT INTO beds (id, name, width_cells, height_cells, year, notes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, width_cells=excluded.width_cells,
         height_cells=excluded.height_cells, year=excluded.year, notes=excluded.notes`,
    );
    for (const b of snap.beds) {
      upsertBed.run(
        str(b.id, uid()),
        str(b.name, "Beet"),
        num(b.widthCells ?? b.width_cells, 8),
        num(b.heightCells ?? b.height_cells, 4),
        num(b.year, new Date().getFullYear()),
        str(b.notes),
      );
      upserted++;
    }

    const upsertSeed = db.prepare(
      `INSERT INTO seeds (
         id, name, species, family, quantity, unit, year_harvested, notes,
         name_de, name_en, name_latin, license, purchased_at, propagated_at,
         generation, parent_seed_id, cultivar_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, species=excluded.species, family=excluded.family,
         quantity=excluded.quantity, name_de=excluded.name_de, name_en=excluded.name_en,
         name_latin=excluded.name_latin, license=excluded.license,
         generation=excluded.generation, cultivar_id=excluded.cultivar_id`,
    );
    for (const s of snap.seeds) {
      upsertSeed.run(
        str(s.id, uid()),
        str(s.name, "Saat"),
        str(s.species ?? s.nameLatin),
        str(s.family),
        num(s.quantity),
        str(s.unit, "pkt"),
        asSql(s.yearHarvested ?? s.year_harvested ?? null),
        str(s.notes),
        str(s.nameDe ?? s.name_de, str(s.name)),
        str(s.nameEn ?? s.name_en),
        str(s.nameLatin ?? s.name_latin),
        str(s.license, "unknown"),
        asSql(s.purchasedAt ?? s.purchased_at ?? null),
        asSql(s.propagatedAt ?? s.propagated_at ?? null),
        num(s.generation),
        asSql(s.parentSeedId ?? s.parent_seed_id ?? null),
        asSql(s.cultivarId ?? s.cultivar_id ?? null),
      );
      upserted++;
    }

    const upsertPlanting = db.prepare(
      `INSERT INTO plantings
         (id, bed_id, seed_id, name, family, x, y, w, h, year, planted_at, harvested_at, phase)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, family=excluded.family, x=excluded.x, y=excluded.y,
         phase=excluded.phase, year=excluded.year`,
    );
    for (const p of snap.plantings) {
      upsertPlanting.run(
        str(p.id, uid()),
        str(p.bedId ?? p.bed_id),
        asSql(p.seedId ?? p.seed_id ?? null),
        str(p.name),
        str(p.family),
        num(p.x),
        num(p.y),
        num(p.w, 1),
        num(p.h, 1),
        num(p.year, new Date().getFullYear()),
        asSql(p.plantedAt ?? p.planted_at ?? null),
        asSql(p.harvestedAt ?? p.harvested_at ?? null),
        str(p.phase, "planned"),
      );
      upserted++;
    }

    const upsertInv = db.prepare(
      `INSERT INTO inventory (id, name, category, quantity, unit, shopping, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, quantity=excluded.quantity, shopping=excluded.shopping`,
    );
    for (const i of snap.inventory) {
      upsertInv.run(
        str(i.id, uid()),
        str(i.name),
        str(i.category, "general"),
        num(i.quantity),
        str(i.unit, "stk"),
        i.shopping ? 1 : 0,
        str(i.notes),
      );
      upserted++;
    }

    const upsertTask = db.prepare(
      `INSERT INTO tasks (id, title, due_at, plant_id, bed_id, done, assignee_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET title=excluded.title, done=excluded.done, due_at=excluded.due_at`,
    );
    for (const t of snap.tasks) {
      upsertTask.run(
        str(t.id, uid()),
        str(t.title),
        asSql(t.dueAt ?? t.due_at ?? null),
        asSql(t.plantId ?? t.plant_id ?? null),
        asSql(t.bedId ?? t.bed_id ?? null),
        t.done ? 1 : 0,
        asSql(t.assigneeId ?? t.assignee_id ?? null),
        str(t.createdAt ?? t.created_at, new Date().toISOString()),
      );
      upserted++;
    }

    if (snap.settings) {
      const set = db.prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      );
      for (const [k, v] of Object.entries(snap.settings)) {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          set.run(k, String(v));
        }
      }
    }

    return { ok: true, upserted, importedAt: new Date().toISOString() };
  });
}
