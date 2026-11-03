import type { FastifyInstance } from "fastify";
import { createWriteStream, mkdirSync } from "node:fs";
import { join, extname } from "node:path";
import { pipeline } from "node:stream/promises";
import { requireAuth } from "../auth/guard.js";
import { config } from "../config.js";
import { db, uid } from "../db.js";

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/plants/:id/photos", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const plant = db.prepare(`SELECT id FROM plants WHERE id = ?`).get(id);
    if (!plant) return reply.code(404).send({ error: "Plant not found" });

    const file = await request.file();
    if (!file) return reply.code(400).send({ error: "file required" });
    const ext = extname(file.filename || "").toLowerCase() || ".jpg";
    if (!ALLOWED.has(ext)) return reply.code(400).send({ error: "unsupported type" });

    const photoId = uid();
    const rel = `plants/${id}/${photoId}${ext}`;
    const absDir = join(config.uploadDir, "plants", id);
    mkdirSync(absDir, { recursive: true });
    const abs = join(config.uploadDir, rel);
    await pipeline(file.file, createWriteStream(abs));

    const caption = String((file.fields as { caption?: { value?: string } })?.caption?.value ?? "");
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO plant_photos (id, plant_id, path, caption, created_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(photoId, id, rel, caption, now);
    db.prepare(`UPDATE plants SET photo_path = ?, updated_at = ? WHERE id = ? AND photo_path IS NULL`).run(
      rel,
      now,
      id,
    );
    db.prepare(`UPDATE plants SET photo_path = ?, updated_at = ? WHERE id = ?`).run(rel, now, id);

    return { photo: { id: photoId, path: rel, url: `/uploads/${rel}`, caption, createdAt: now } };
  });

  app.get("/api/plants/:id/photos", { preHandler: requireAuth }, async (request) => {
    const { id } = request.params as { id: string };
    const rows = db
      .prepare(
        `SELECT id, path, caption, created_at as createdAt FROM plant_photos
         WHERE plant_id = ? ORDER BY created_at DESC`,
      )
      .all(id)
      .map((r) => ({
        ...(r as object),
        url: `/uploads/${(r as { path: string }).path}`,
      }));
    return { photos: rows };
  });

  app.delete("/api/photos/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare(`DELETE FROM plant_photos WHERE id = ?`).run(id);
    return reply.code(204).send();
  });
}
