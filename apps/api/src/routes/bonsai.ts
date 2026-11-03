import type { FastifyInstance } from "fastify";
import { bonsaiProfileSchema } from "@hortis/shared";
import { suggestRepotYears, tasksForMonth, wireOverdue } from "@hortis/bonsai-engine";
import { db } from "../db.js";
import { requireAuth } from "../auth/guard.js";
import { mapBonsai, mapPlant } from "../mappers.js";

export async function bonsaiRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireAuth);

  app.get("/api/bonsai", async () => {
    const plants = db
      .prepare(`SELECT * FROM plants WHERE kind = 'bonsai' ORDER BY name`)
      .all()
      .map((r) => mapPlant(r as Record<string, unknown>));
    const profiles = db
      .prepare(`SELECT * FROM bonsai_profiles`)
      .all()
      .map((r) => mapBonsai(r as Record<string, unknown>));
    const byPlant = new Map(profiles.map((p) => [p.plantId, p]));
    return {
      items: plants.map((plant) => ({
        plant,
        profile: byPlant.get(String(plant.id)) ?? null,
        wireOverdue: wireOverdue(byPlant.get(String(plant.id))?.wiredUntil ?? null),
      })),
    };
  });

  app.put("/api/bonsai/:plantId", async (request, reply) => {
    const { plantId } = request.params as { plantId: string };
    const plant = db
      .prepare(`SELECT * FROM plants WHERE id = ? AND kind = 'bonsai'`)
      .get(plantId);
    if (!plant) return reply.code(404).send({ error: "Bonsai plant not found" });

    const parsed = bonsaiProfileSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    db.prepare(
      `INSERT INTO bonsai_profiles
        (plant_id, style, phase, pot_type, height_cm, wired_until, last_repot_at, winter_protection, training_notes,
         age_years, trunk_diameter_cm, nebari_notes, species_group, outdoor, next_wiring_at, display_ready)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(plant_id) DO UPDATE SET
         style=excluded.style,
         phase=excluded.phase,
         pot_type=excluded.pot_type,
         height_cm=excluded.height_cm,
         wired_until=excluded.wired_until,
         last_repot_at=excluded.last_repot_at,
         winter_protection=excluded.winter_protection,
         training_notes=excluded.training_notes,
         age_years=excluded.age_years,
         trunk_diameter_cm=excluded.trunk_diameter_cm,
         nebari_notes=excluded.nebari_notes,
         species_group=excluded.species_group,
         outdoor=excluded.outdoor,
         next_wiring_at=excluded.next_wiring_at,
         display_ready=excluded.display_ready`,
    ).run(
      plantId,
      parsed.data.style,
      parsed.data.phase,
      parsed.data.potType,
      parsed.data.heightCm ?? null,
      parsed.data.wiredUntil ?? null,
      parsed.data.lastRepotAt ?? null,
      parsed.data.winterProtection ? 1 : 0,
      parsed.data.trainingNotes,
      parsed.data.ageYears ?? null,
      parsed.data.trunkDiameterCm ?? null,
      parsed.data.nebariNotes,
      parsed.data.speciesGroup,
      parsed.data.outdoor ? 1 : 0,
      parsed.data.nextWiringAt ?? null,
      parsed.data.displayReady ? 1 : 0,
    );

    const row = db.prepare(`SELECT * FROM bonsai_profiles WHERE plant_id = ?`).get(plantId);
    const profile = mapBonsai(row as Record<string, unknown>);
    return {
      profile,
      seasonal: tasksForMonth(new Date().getMonth() + 1, profile.phase),
      suggestRepotYears: suggestRepotYears(profile.phase),
      wireOverdue: wireOverdue(profile.wiredUntil),
    };
  });

  app.get("/api/bonsai/:plantId/season", async (request, reply) => {
    const { plantId } = request.params as { plantId: string };
    const row = db.prepare(`SELECT * FROM bonsai_profiles WHERE plant_id = ?`).get(plantId);
    if (!row) return reply.code(404).send({ error: "Profile not found" });
    const profile = mapBonsai(row as Record<string, unknown>);
    const month = new Date().getMonth() + 1;
    return {
      month,
      tasks: tasksForMonth(month, profile.phase),
      suggestRepotYears: suggestRepotYears(profile.phase),
      wireOverdue: wireOverdue(profile.wiredUntil),
    };
  });
}
