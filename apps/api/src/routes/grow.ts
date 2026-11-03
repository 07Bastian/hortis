import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  accumulateGdd,
  flushProtocol,
  optimizeLayout,
  phaseFromGdd,
  planMix,
  resolveCropMeta,
} from "@hortis/garden-engine";
import { requireAuth } from "../auth/guard.js";
import { db, uid } from "../db.js";
import { mapPlanting } from "../mappers.js";
import { getSettings } from "../services/settings.js";

export async function growRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireAuth);

  app.post("/api/garden/optimize", async (request, reply) => {
    const parsed = z
      .object({
        bedId: z.string().uuid(),
        mode: z.enum(["fresh", "fit"]).default("fresh"),
        crops: z
          .array(
            z.object({
              name: z.string().min(1),
              family: z.string().default(""),
              w: z.number().int().min(1).max(10).optional(),
              h: z.number().int().min(1).max(10).optional(),
            }),
          )
          .min(1)
          .max(40),
        seed: z.number().int().optional(),
        apply: z.boolean().default(false),
      })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const bed = db.prepare(`SELECT * FROM beds WHERE id = ?`).get(parsed.data.bedId) as
      | Record<string, unknown>
      | undefined;
    if (!bed) return reply.code(404).send({ error: "Bed not found" });

    const year = Number(bed.year);
    const current = db
      .prepare(`SELECT * FROM plantings WHERE bed_id = ? AND year = ?`)
      .all(parsed.data.bedId, year)
      .map((r) => mapPlanting(r as Record<string, unknown>));
    const history = db
      .prepare(`SELECT * FROM plantings WHERE bed_id = ? AND year < ?`)
      .all(parsed.data.bedId, year)
      .map((r) => mapPlanting(r as Record<string, unknown>));

    const result = optimizeLayout(
      {
        bedId: parsed.data.bedId,
        year,
        widthCells: Number(bed.width_cells),
        heightCells: Number(bed.height_cells),
        crops: parsed.data.crops,
        locked: parsed.data.mode === "fit" ? current : [],
        history,
        mode: parsed.data.mode,
      },
      parsed.data.seed ?? Date.now() % 100000,
    );

    if (parsed.data.apply) {
      if (parsed.data.mode === "fresh") {
        db.prepare(`DELETE FROM plantings WHERE bed_id = ? AND year = ?`).run(
          parsed.data.bedId,
          year,
        );
      }
      const insert = db.prepare(
        `INSERT INTO plantings
          (id, bed_id, seed_id, name, family, x, y, w, h, year, planted_at, phase)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, NULL, 'planned')`,
      );
      for (const p of result.plantings) {
        insert.run(uid(), parsed.data.bedId, p.name, p.family, p.x, p.y, p.w, p.h, year);
      }
    }

    return result;
  });

  app.post("/api/grow/mix", async (request, reply) => {
    const parsed = z
      .object({
        volumeL: z.number().positive(),
        targetEc: z.number().min(0).max(5),
        sourceEc: z.number().min(0).max(5).default(0.3),
        source: z.enum(["tap", "ro", "rain", "mixed"]).default("tap"),
        saltsG: z
          .array(
            z.object({
              name: z.string(),
              grams: z.number().min(0),
              order: z.number().int().default(1),
            }),
          )
          .default([]),
      })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return { mix: planMix(parsed.data) };
  });

  app.post("/api/grow/flush", async (request, reply) => {
    const parsed = z
      .object({ volumeL: z.number().positive(), currentEc: z.number().min(0) })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return { steps: flushProtocol(parsed.data.volumeL, parsed.data.currentEc) };
  });

  app.get("/api/grow/gdd", async (request, reply) => {
    const { name, plantingId, days } = request.query as {
      name?: string;
      plantingId?: string;
      days?: string;
    };
    let cropName = name || "";
    if (plantingId) {
      const p = db.prepare(`SELECT name FROM plantings WHERE id = ?`).get(plantingId) as
        | { name: string }
        | undefined;
      if (!p) return reply.code(404).send({ error: "Planting not found" });
      cropName = p.name;
    }
    if (!cropName) return reply.code(400).send({ error: "name or plantingId required" });

    const meta = resolveCropMeta(cropName);
    const dayCount = Math.min(120, Math.max(1, Number(days) || 30));
    const temps = await fetchDailyTemps(dayCount);
    const accumulated = accumulateGdd(temps, meta.group);
    const phase = phaseFromGdd(accumulated, meta.target);

    if (plantingId) {
      db.prepare(`UPDATE plantings SET phase = ? WHERE id = ? AND phase != 'done'`).run(
        phase.phase,
        plantingId,
      );
    }

    return {
      crop: cropName,
      group: meta.group,
      targetGdd: meta.target,
      accumulatedGdd: Math.round(accumulated),
      ...phase,
      days: dayCount,
      source: temps.length ? "open-meteo" : "fallback",
    };
  });

  app.get("/api/grow/gdd/batch", async (request) => {
    const { bedId } = request.query as { bedId?: string };
    const year = new Date().getFullYear();
    const rows = (
      bedId
        ? db.prepare(`SELECT * FROM plantings WHERE bed_id = ? AND year = ?`).all(bedId, year)
        : db.prepare(`SELECT * FROM plantings WHERE year = ?`).all(year)
    ).map((r) => mapPlanting(r as Record<string, unknown>));
    const temps = await fetchDailyTemps(30);
    return {
      items: rows.map((p) => {
        const meta = resolveCropMeta(p.name);
        const accumulated = accumulateGdd(temps, meta.group);
        const phase = phaseFromGdd(accumulated, meta.target);
        return {
          plantingId: p.id,
          name: p.name,
          group: meta.group,
          targetGdd: meta.target,
          accumulatedGdd: Math.round(accumulated),
          ...phase,
        };
      }),
    };
  });
}

async function fetchDailyTemps(
  days: number,
): Promise<{ tMinC: number; tMaxC: number }[]> {
  const s = getSettings();
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${s.weatherLat}&longitude=${s.weatherLon}` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=auto` +
    `&start_date=${start.toISOString().slice(0, 10)}&end_date=${end.toISOString().slice(0, 10)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("meteo");
    const data = (await res.json()) as {
      daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
    };
    const max = data.daily?.temperature_2m_max || [];
    const min = data.daily?.temperature_2m_min || [];
    return max.map((tMax, i) => ({ tMaxC: tMax, tMinC: min[i] ?? tMax - 8 }));
  } catch {
    // mild spring fallback
    return Array.from({ length: days }, () => ({ tMinC: 8, tMaxC: 18 }));
  }
}
