import type { FastifyInstance } from "fastify";
import { z } from "zod";
import webpush from "web-push";
import { requireAdmin, requireAuth } from "../auth/guard.js";
import { getSettings, publicSettings, setSettings } from "../services/settings.js";
import { notifyAll } from "../services/notify.js";
import { db, uid } from "../db.js";
import { exportIcal, importIcal } from "../services/calendar.js";
import { GUIDES, getGuide } from "../guides/content.js";

const settingsPatchSchema = z.object({
  weatherLat: z.number().min(-90).max(90).optional(),
  weatherLon: z.number().min(-180).max(180).optional(),
  weatherLabel: z.string().max(120).optional(),
  smtpHost: z.string().max(200).optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().max(200).optional(),
  smtpPass: z.string().max(200).optional(),
  smtpFrom: z.string().max(200).optional(),
  smtpSecure: z.boolean().optional(),
  telegramBotToken: z.string().max(200).optional(),
  telegramChatId: z.string().max(100).optional(),
  signalWebhookUrl: z.string().max(500).optional(),
  notifyMail: z.boolean().optional(),
  notifyTelegram: z.boolean().optional(),
  notifySignal: z.boolean().optional(),
  notifyPush: z.boolean().optional(),
  vapidSubject: z.string().max(200).optional(),
});

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/settings", { preHandler: requireAuth }, async () => ({
    settings: publicSettings(),
  }));

  app.patch("/api/settings", { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = settingsPatchSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const next = setSettings(parsed.data);
    return { settings: publicSettings(), weatherLat: next.weatherLat, weatherLon: next.weatherLon };
  });

  app.post("/api/settings/vapid", { preHandler: requireAdmin }, async () => {
    const keys = webpush.generateVAPIDKeys();
    setSettings({
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
      notifyPush: true,
    });
    return { vapidPublicKey: keys.publicKey };
  });

  app.post("/api/settings/test-notify", { preHandler: requireAdmin }, async () => {
    await notifyAll(
      "Testbenachrichtigung",
      "Hortis erreicht Mail, Telegram, Signal und Push (soweit aktiviert).",
    );
    return { ok: true };
  });

  app.post("/api/push/subscribe", { preHandler: requireAuth }, async (request, reply) => {
    const body = request.body as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return reply.code(400).send({ error: "Invalid subscription" });
    }
    db.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).run(body.endpoint);
    db.prepare(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      uid(),
      request.user.id,
      body.endpoint,
      body.keys.p256dh,
      body.keys.auth,
      new Date().toISOString(),
    );
    return { ok: true };
  });

  app.get("/api/guides", { preHandler: requireAuth }, async (request) => {
    const { pillar } = request.query as { pillar?: string };
    const list = pillar ? GUIDES.filter((g) => g.pillar === pillar) : GUIDES;
    return {
      guides: list.map((g) => ({
        id: g.id,
        pillar: g.pillar,
        title: g.title,
        summary: g.summary,
      })),
    };
  });

  app.get("/api/guides/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const guide = getGuide(id);
    if (!guide) return reply.code(404).send({ error: "Not found" });
    return { guide };
  });

  app.get("/api/calendar.ics", { preHandler: requireAuth }, async (_request, reply) => {
    const ics = exportIcal();
    reply.header("Content-Type", "text/calendar; charset=utf-8");
    reply.header("Content-Disposition", 'attachment; filename="hortis.ics"');
    return reply.send(ics);
  });

  app.post("/api/calendar/import", { preHandler: requireAuth }, async (request, reply) => {
    const body = request.body as { ics?: string };
    if (!body.ics || body.ics.length > 2_000_000) {
      return reply.code(400).send({ error: "ics required" });
    }
    const count = importIcal(body.ics);
    return { imported: count };
  });

  app.get("/api/notifications/log", { preHandler: requireAdmin }, async () => {
    const rows = db
      .prepare(
        `SELECT id, channel, subject, status, created_at as createdAt
         FROM notification_log ORDER BY created_at DESC LIMIT 50`,
      )
      .all();
    return { log: rows };
  });

  // seed default weather near Murnau/Hof if empty
  const s = getSettings();
  if (!db.prepare(`SELECT key FROM settings WHERE key = 'weatherLabel'`).get()) {
    setSettings({
      weatherLat: 47.6779,
      weatherLon: 11.2012,
      weatherLabel: "Murnau / Hof",
    });
  } else if (s.weatherLabel === "Hof / Murnau" && s.weatherLat === 47.9) {
    setSettings({
      weatherLat: 47.6779,
      weatherLon: 11.2012,
      weatherLabel: "Murnau / Hof",
    });
  }
}
