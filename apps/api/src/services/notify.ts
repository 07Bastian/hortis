import { createTransport } from "nodemailer";
import webpush from "web-push";
import { db, uid } from "../db.js";
import { getSettings } from "./settings.js";

function log(channel: string, subject: string, body: string, status: string) {
  db.prepare(
    `INSERT INTO notification_log (id, channel, subject, body, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(uid(), channel, subject, body, status, new Date().toISOString());
}

export async function sendMail(subject: string, body: string): Promise<boolean> {
  const s = getSettings();
  if (!s.notifyMail || !s.smtpHost || !s.smtpFrom) {
    log("mail", subject, body, "skipped");
    return false;
  }
  try {
    const transport = createTransport({
      host: s.smtpHost,
      port: s.smtpPort,
      secure: s.smtpSecure,
      auth: s.smtpUser ? { user: s.smtpUser, pass: s.smtpPass } : undefined,
    });
    await transport.sendMail({
      from: s.smtpFrom,
      to: s.smtpFrom,
      subject: `[Hortis] ${subject}`,
      text: body,
    });
    log("mail", subject, body, "sent");
    return true;
  } catch (err) {
    log("mail", subject, String(err), "error");
    return false;
  }
}

export async function sendTelegram(subject: string, body: string): Promise<boolean> {
  const s = getSettings();
  if (!s.notifyTelegram || !s.telegramBotToken || !s.telegramChatId) {
    log("telegram", subject, body, "skipped");
    return false;
  }
  try {
    const text = `*Hortis*\n*${subject}*\n${body}`;
    const res = await fetch(
      `https://api.telegram.org/bot${s.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: s.telegramChatId,
          text,
          parse_mode: "Markdown",
        }),
      },
    );
    log("telegram", subject, body, res.ok ? "sent" : `error:${res.status}`);
    return res.ok;
  } catch (err) {
    log("telegram", subject, String(err), "error");
    return false;
  }
}

/** Signal via signal-cli-rest-api / any webhook that accepts {message}. */
export async function sendSignal(subject: string, body: string): Promise<boolean> {
  const s = getSettings();
  if (!s.notifySignal || !s.signalWebhookUrl) {
    log("signal", subject, body, "skipped");
    return false;
  }
  try {
    const res = await fetch(s.signalWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Hortis: ${subject}\n${body}`,
        number: "default",
      }),
    });
    log("signal", subject, body, res.ok ? "sent" : `error:${res.status}`);
    return res.ok;
  } catch (err) {
    log("signal", subject, String(err), "error");
    return false;
  }
}

export async function sendPush(subject: string, body: string): Promise<boolean> {
  const s = getSettings();
  if (!s.notifyPush || !s.vapidPublicKey || !s.vapidPrivateKey) {
    log("push", subject, body, "skipped");
    return false;
  }
  webpush.setVapidDetails(s.vapidSubject, s.vapidPublicKey, s.vapidPrivateKey);
  const rows = db
    .prepare(`SELECT id, endpoint, p256dh, auth FROM push_subscriptions`)
    .all() as { id: string; endpoint: string; p256dh: string; auth: string }[];
  let ok = false;
  for (const row of rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        JSON.stringify({ title: `Hortis: ${subject}`, body }),
      );
      ok = true;
    } catch {
      db.prepare(`DELETE FROM push_subscriptions WHERE id = ?`).run(row.id);
    }
  }
  log("push", subject, body, ok ? "sent" : "empty");
  return ok;
}

export async function notifyAll(subject: string, body: string) {
  await Promise.all([
    sendMail(subject, body),
    sendTelegram(subject, body),
    sendSignal(subject, body),
    sendPush(subject, body),
  ]);
}
