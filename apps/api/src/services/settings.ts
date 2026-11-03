import { db } from "../db.js";
import { config } from "../config.js";

export type AppSettings = {
  weatherLat: number;
  weatherLon: number;
  weatherLabel: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  smtpSecure: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  signalWebhookUrl: string;
  notifyMail: boolean;
  notifyTelegram: boolean;
  notifySignal: boolean;
  notifyPush: boolean;
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string;
};

const DEFAULTS: AppSettings = {
  weatherLat: config.weatherLat,
  weatherLon: config.weatherLon,
  weatherLabel: "Hof / Murnau",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  smtpFrom: "",
  smtpSecure: false,
  telegramBotToken: "",
  telegramChatId: "",
  signalWebhookUrl: "",
  notifyMail: false,
  notifyTelegram: false,
  notifySignal: false,
  notifyPush: false,
  vapidPublicKey: "",
  vapidPrivateKey: "",
  vapidSubject: "mailto:admin@hortis.local",
};

function getRaw(key: string): string | null {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function getSettings(): AppSettings {
  const out = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS) as (keyof AppSettings)[]) {
    const raw = getRaw(key);
    if (raw == null) continue;
    const def = DEFAULTS[key];
    if (typeof def === "boolean") (out as Record<string, unknown>)[key] = raw === "1" || raw === "true";
    else if (typeof def === "number") (out as Record<string, unknown>)[key] = Number(raw);
    else (out as Record<string, unknown>)[key] = raw;
  }
  return out;
}

export function setSettings(patch: Partial<AppSettings>): AppSettings {
  const cur = getSettings();
  const next = { ...cur, ...patch };
  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  );
  for (const key of Object.keys(next) as (keyof AppSettings)[]) {
    const v = next[key];
    const stored = typeof v === "boolean" ? (v ? "1" : "0") : String(v ?? "");
    upsert.run(key, stored);
  }
  return next;
}

export function publicSettings() {
  const s = getSettings();
  return {
    weatherLat: s.weatherLat,
    weatherLon: s.weatherLon,
    weatherLabel: s.weatherLabel,
    smtpHost: s.smtpHost,
    smtpPort: s.smtpPort,
    smtpUser: s.smtpUser,
    smtpFrom: s.smtpFrom,
    smtpSecure: s.smtpSecure,
    telegramChatId: s.telegramChatId,
    signalWebhookUrl: s.signalWebhookUrl ? "[configured]" : "",
    notifyMail: s.notifyMail,
    notifyTelegram: s.notifyTelegram,
    notifySignal: s.notifySignal,
    notifyPush: s.notifyPush,
    vapidPublicKey: s.vapidPublicKey,
    vapidSubject: s.vapidSubject,
    hasSmtpPass: Boolean(s.smtpPass),
    hasTelegramToken: Boolean(s.telegramBotToken),
    hasSignalWebhook: Boolean(s.signalWebhookUrl),
    hasVapidPrivate: Boolean(s.vapidPrivateKey),
  };
}
