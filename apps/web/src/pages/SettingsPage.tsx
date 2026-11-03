import { FormEvent, useEffect, useState } from "react";
import { api, getToken } from "../api";

type Settings = {
  weatherLat: number;
  weatherLon: number;
  weatherLabel: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  smtpSecure: boolean;
  telegramChatId: string;
  notifyMail: boolean;
  notifyTelegram: boolean;
  notifySignal: boolean;
  notifyPush: boolean;
  vapidPublicKey: string;
  hasSmtpPass: boolean;
  hasTelegramToken: boolean;
  hasSignalWebhook: boolean;
};

export function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [smtpPass, setSmtpPass] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [signalUrl, setSignalUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [icsText, setIcsText] = useState("");

  async function load() {
    const res = await api<{ settings: Settings }>("/api/settings");
    setS(res.settings);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!s) return;
    const body: Record<string, unknown> = {
      weatherLat: Number(s.weatherLat),
      weatherLon: Number(s.weatherLon),
      weatherLabel: s.weatherLabel,
      smtpHost: s.smtpHost,
      smtpPort: Number(s.smtpPort),
      smtpUser: s.smtpUser,
      smtpFrom: s.smtpFrom,
      smtpSecure: s.smtpSecure,
      telegramChatId: s.telegramChatId,
      notifyMail: s.notifyMail,
      notifyTelegram: s.notifyTelegram,
      notifySignal: s.notifySignal,
      notifyPush: s.notifyPush,
    };
    if (smtpPass) body.smtpPass = smtpPass;
    if (telegramToken) body.telegramBotToken = telegramToken;
    if (signalUrl) body.signalWebhookUrl = signalUrl;
    await api("/api/settings", { method: "PATCH", body: JSON.stringify(body) });
    setMsg("Gespeichert – Wetter nutzt ab sofort die neuen Koordinaten.");
    setSmtpPass("");
    setTelegramToken("");
    setSignalUrl("");
    await load();
  }

  async function genVapid() {
    const res = await api<{ vapidPublicKey: string }>("/api/settings/vapid", { method: "POST" });
    setMsg(`VAPID erzeugt. Public: ${res.vapidPublicKey.slice(0, 24)}…`);
    await load();
  }

  async function testNotify() {
    await api("/api/settings/test-notify", { method: "POST" });
    setMsg("Testnachricht an aktivierte Kanäle gesendet.");
  }

  async function subscribePush() {
    if (!s?.vapidPublicKey) {
      setMsg("Zuerst VAPID erzeugen.");
      return;
    }
    const reg = await navigator.serviceWorker.register("/sw.js");
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(s.vapidPublicKey),
    });
    const json = sub.toJSON();
    await api("/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });
    setMsg("Browser-Push abonniert.");
  }

  async function importCal(e: FormEvent) {
    e.preventDefault();
    const res = await api<{ imported: number }>("/api/calendar/import", {
      method: "POST",
      body: JSON.stringify({ ics: icsText }),
    });
    setMsg(`${res.imported} Kalender-Termine als Aufgaben importiert.`);
  }

  if (!s) return <p className="muted">Lade Einstellungen…</p>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Einstellungen</h1>
          <p>Wetter-Standort, Benachrichtigungen und Kalender.</p>
        </div>
      </div>

      {msg ? <div className="badge" style={{ marginBottom: 12 }}>{msg}</div> : null}

      <form className="grid cols-2" onSubmit={save}>
        <section className="panel stack">
          <h3>Wetter-Standort</h3>
          <p className="muted">
            Open-Meteo nutzt Latitude/Longitude. Voreinstellung: Murnau / Hof (47.6779, 11.2012).
            Du kannst Werte von openstreetmap.org oder Google Maps übernehmen.
          </p>
          <label className="field">
            Bezeichnung
            <input
              value={s.weatherLabel}
              onChange={(e) => setS({ ...s, weatherLabel: e.target.value })}
            />
          </label>
          <div className="row">
            <label className="field">
              Latitude
              <input
                type="number"
                step="0.0001"
                value={s.weatherLat}
                onChange={(e) => setS({ ...s, weatherLat: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              Longitude
              <input
                type="number"
                step="0.0001"
                value={s.weatherLon}
                onChange={(e) => setS({ ...s, weatherLon: Number(e.target.value) })}
              />
            </label>
          </div>
          <button type="button" className="btn secondary" onClick={() => setS({
            ...s,
            weatherLat: 47.6779,
            weatherLon: 11.2012,
            weatherLabel: "Murnau / Hof",
          })}>
            Auf Murnau / Hof setzen
          </button>
        </section>

        <section className="panel stack">
          <h3>Kanäle</h3>
          <label className="check">
            <input
              type="checkbox"
              checked={s.notifyMail}
              onChange={(e) => setS({ ...s, notifyMail: e.target.checked })}
            />
            E-Mail (SMTP)
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={s.notifyTelegram}
              onChange={(e) => setS({ ...s, notifyTelegram: e.target.checked })}
            />
            Telegram
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={s.notifySignal}
              onChange={(e) => setS({ ...s, notifySignal: e.target.checked })}
            />
            Signal-Webhook
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={s.notifyPush}
              onChange={(e) => setS({ ...s, notifyPush: e.target.checked })}
            />
            Browser-Push
          </label>
          <div className="row">
            <button type="button" className="btn secondary" onClick={() => void testNotify()}>
              Test senden
            </button>
            <button type="button" className="btn secondary" onClick={() => void genVapid()}>
              VAPID erzeugen
            </button>
            <button type="button" className="btn secondary" onClick={() => void subscribePush()}>
              Push abonnieren
            </button>
          </div>
        </section>

        <section className="panel stack">
          <h3>SMTP</h3>
          <label className="field">
            Host
            <input value={s.smtpHost} onChange={(e) => setS({ ...s, smtpHost: e.target.value })} />
          </label>
          <div className="row">
            <label className="field">
              Port
              <input
                type="number"
                value={s.smtpPort}
                onChange={(e) => setS({ ...s, smtpPort: Number(e.target.value) })}
              />
            </label>
            <label className="check" style={{ marginTop: 24 }}>
              <input
                type="checkbox"
                checked={s.smtpSecure}
                onChange={(e) => setS({ ...s, smtpSecure: e.target.checked })}
              />
              TLS/SSL
            </label>
          </div>
          <label className="field">
            Benutzer
            <input value={s.smtpUser} onChange={(e) => setS({ ...s, smtpUser: e.target.value })} />
          </label>
          <label className="field">
            Passwort {s.hasSmtpPass ? "(gesetzt)" : ""}
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="nur zum Ändern ausfüllen"
            />
          </label>
          <label className="field">
            From / To
            <input value={s.smtpFrom} onChange={(e) => setS({ ...s, smtpFrom: e.target.value })} />
          </label>
        </section>

        <section className="panel stack">
          <h3>Telegram & Signal</h3>
          <label className="field">
            Telegram Bot-Token {s.hasTelegramToken ? "(gesetzt)" : ""}
            <input
              type="password"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              placeholder="123456:ABC..."
            />
          </label>
          <label className="field">
            Telegram Chat-ID
            <input
              value={s.telegramChatId}
              onChange={(e) => setS({ ...s, telegramChatId: e.target.value })}
            />
          </label>
          <label className="field">
            Signal Webhook-URL {s.hasSignalWebhook ? "(gesetzt)" : ""}
            <input
              value={signalUrl}
              onChange={(e) => setSignalUrl(e.target.value)}
              placeholder="http://signal-cli:8080/v2/send"
            />
          </label>
        </section>

        <div className="row" style={{ gridColumn: "1 / -1" }}>
          <button className="btn">Alles speichern</button>
          <a className="btn secondary" href={`/api/calendar.ics?token=${getToken()}`} onClick={(e) => {
            e.preventDefault();
            void fetch("/api/calendar.ics", {
              headers: { Authorization: `Bearer ${getToken()}` },
            }).then(async (r) => {
              const blob = await r.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "hortis.ics";
              a.click();
            });
          }}>
            Kalender exportieren (.ics)
          </a>
        </div>
      </form>

      <form className="panel stack" style={{ marginTop: "1rem" }} onSubmit={importCal}>
        <h3>Kalender importieren</h3>
        <p className="muted">iCal/ICS-Inhalt einfügen – VEVENTs werden zu Aufgaben.</p>
        <textarea value={icsText} onChange={(e) => setIcsText(e.target.value)} rows={8} />
        <button className="btn">Importieren</button>
      </form>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
