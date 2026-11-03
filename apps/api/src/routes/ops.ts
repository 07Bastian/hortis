import type { FastifyInstance } from "fastify";
import { inventorySchema, taskSchema } from "@hortis/shared";
import { createReadStream, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { db, uid } from "../db.js";
import { requireAuth, requireAdmin } from "../auth/guard.js";
import { config } from "../config.js";
import { asSql } from "../mappers.js";
import { getWeatherSummary } from "../services/weather.js";

export async function opsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/health", async () => ({ ok: true, name: "hortis", version: "0.1.0" }));

  app.get("/api/weather", { preHandler: requireAuth }, async () => {
    return getWeatherSummary();
  });

  app.get("/api/tasks", { preHandler: requireAuth }, async () => {
    const rows = db
      .prepare(
        `SELECT id, title, due_at as dueAt, plant_id as plantId, bed_id as bedId,
                done, assignee_id as assigneeId, created_at as createdAt
         FROM tasks ORDER BY done ASC, due_at IS NULL, due_at ASC`,
      )
      .all()
      .map((r) => ({ ...r, done: Boolean((r as { done: number }).done) }));
    return { tasks: rows };
  });

  app.post("/api/tasks", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = taskSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const id = uid();
    db.prepare(
      `INSERT INTO tasks (id, title, due_at, plant_id, bed_id, done, assignee_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.data.title,
      parsed.data.dueAt ?? null,
      parsed.data.plantId ?? null,
      parsed.data.bedId ?? null,
      parsed.data.done ? 1 : 0,
      parsed.data.assigneeId ?? null,
      new Date().toISOString(),
    );
    return { id, ...parsed.data };
  });

  app.patch("/api/tasks/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = taskSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const cur = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!cur) return reply.code(404).send({ error: "Not found" });
    db.prepare(
      `UPDATE tasks SET title=?, due_at=?, plant_id=?, bed_id=?, done=?, assignee_id=? WHERE id=?`,
    ).run(
      asSql(parsed.data.title ?? cur.title),
      asSql(parsed.data.dueAt === undefined ? cur.due_at : parsed.data.dueAt),
      asSql(parsed.data.plantId === undefined ? cur.plant_id : parsed.data.plantId),
      asSql(parsed.data.bedId === undefined ? cur.bed_id : parsed.data.bedId),
      asSql(parsed.data.done === undefined ? cur.done : parsed.data.done ? 1 : 0),
      asSql(parsed.data.assigneeId === undefined ? cur.assignee_id : parsed.data.assigneeId),
      id,
    );
    return { ok: true };
  });

  app.delete("/api/tasks/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
    return reply.code(204).send();
  });

  app.get("/api/inventory", { preHandler: requireAuth }, async () => {
    const rows = db
      .prepare(
        `SELECT id, name, category, quantity, unit, shopping, notes FROM inventory ORDER BY shopping DESC, name`,
      )
      .all()
      .map((r) => ({ ...r, shopping: Boolean((r as { shopping: number }).shopping) }));
    return { items: rows };
  });

  app.post("/api/inventory", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = inventorySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const id = uid();
    db.prepare(
      `INSERT INTO inventory (id, name, category, quantity, unit, shopping, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.data.name,
      parsed.data.category,
      parsed.data.quantity,
      parsed.data.unit,
      parsed.data.shopping ? 1 : 0,
      parsed.data.notes,
    );
    return { id, ...parsed.data };
  });

  app.patch("/api/inventory/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = inventorySchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const cur = db.prepare(`SELECT * FROM inventory WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!cur) return reply.code(404).send({ error: "Not found" });
    db.prepare(
      `UPDATE inventory SET name=?, category=?, quantity=?, unit=?, shopping=?, notes=? WHERE id=?`,
    ).run(
      asSql(parsed.data.name ?? cur.name),
      asSql(parsed.data.category ?? cur.category),
      asSql(parsed.data.quantity ?? cur.quantity),
      asSql(parsed.data.unit ?? cur.unit),
      asSql(parsed.data.shopping === undefined ? cur.shopping : parsed.data.shopping ? 1 : 0),
      asSql(parsed.data.notes ?? cur.notes),
      id,
    );
    return { ok: true };
  });

  app.delete("/api/inventory/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare(`DELETE FROM inventory WHERE id = ?`).run(id);
    return reply.code(204).send();
  });

  app.get("/api/backup", { preHandler: requireAdmin }, async (_request, reply) => {
    mkdirSync(config.uploadDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outPath = join(config.uploadDir, `backup-${stamp}.sql`);
    const tables = [
      "users",
      "locations",
      "plants",
      "care_events",
      "care_reminders",
      "bonsai_profiles",
      "beds",
      "seeds",
      "plantings",
      "inventory",
      "tasks",
      "settings",
      "chat_messages",
      "calendar_events",
      "harvest_logs",
      "plant_photos",
    ];
    const chunks: string[] = ["BEGIN;"];
    for (const table of tables) {
      try {
        const rows = db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];
        for (const row of rows) {
          const cols = Object.keys(row);
          const vals = cols.map((c) => {
            const v = row[c];
            if (v === null || v === undefined) return "NULL";
            if (typeof v === "number") return String(v);
            return `'${String(v).replace(/'/g, "''")}'`;
          });
          chunks.push(
            `INSERT OR REPLACE INTO ${table} (${cols.join(",")}) VALUES (${vals.join(",")});`,
          );
        }
      } catch {
        /* table may not exist yet */
      }
    }
    chunks.push("COMMIT;");
    writeFileSync(outPath, chunks.join("\n"), "utf8");
    reply.header("Content-Type", "application/sql");
    reply.header("Content-Disposition", `attachment; filename="hortis-backup-${stamp}.sql"`);
    return reply.send(createReadStream(outPath));
  });

  app.post("/api/backup/restore", { preHandler: requireAdmin }, async (request, reply) => {
    const body = request.body as { sql?: string };
    if (!body.sql || body.sql.length > 20_000_000) {
      return reply.code(400).send({ error: "sql required" });
    }
    if (!body.sql.includes("BEGIN") || !/INSERT OR REPLACE INTO/i.test(body.sql)) {
      return reply.code(400).send({ error: "Invalid Hortis backup format" });
    }
    // Only allow INSERT OR REPLACE / BEGIN / COMMIT — no DROP/DELETE/ATTACH
    const dangerous = /\b(DROP|DELETE|ATTACH|UPDATE\s+users\s+SET\s+password|\bALTER\b)/i;
    if (dangerous.test(body.sql.replace(/INSERT OR REPLACE[\s\S]*?;/gi, ""))) {
      return reply.code(400).send({ error: "Backup contains disallowed statements" });
    }
    try {
      db.exec(body.sql);
      return { ok: true };
    } catch (e) {
      return reply.code(400).send({ error: String(e) });
    }
  });
}
