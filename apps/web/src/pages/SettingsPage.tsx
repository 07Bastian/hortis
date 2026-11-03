import { FormEvent, useEffect, useState } from "react";
import { api, getApiBase, getMode, getToken, setApiBase, setMode, type AppMode } from "../api";
import { useI18n } from "../i18n/context";
import {
  applySnapshotToLocal,
  buildLocalSnapshot,
  downloadJson,
  pullServerToLocal,
  pushLocalToServer,
  type HortisSyncV1,
} from "../local/sync";
import { useTheme, type ThemeId } from "../theme";

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
  hasPlantNetKey?: boolean;
  hasAutomationWebhook?: boolean;
};

export function SettingsPage() {
  const { theme, themes, setTheme } = useTheme();
  const { t, lang, setLang } = useI18n();
  const [mode, setModeState] = useState<AppMode>(getMode());
  const [apiBase, setApiBaseState] = useState(getApiBase());
  const [s, setS] = useState<Settings | null>(null);
  const [smtpPass, setSmtpPass] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [signalUrl, setSignalUrl] = useState("");
  const [plantNetKey, setPlantNetKey] = useState("");
  const [automationUrl, setAutomationUrl] = useState("");
  const [tokenName, setTokenName] = useState("home-assistant");
  const [newToken, setNewToken] = useState("");
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
    if (plantNetKey) body.plantNetApiKey = plantNetKey;
    if (automationUrl) body.automationWebhookUrl = automationUrl;
    await api("/api/settings", { method: "PATCH", body: JSON.stringify(body) });
    setMsg("Gespeichert – Wetter nutzt ab sofort die neuen Koordinaten.");
    setSmtpPass("");
    setTelegramToken("");
    setSignalUrl("");
    setPlantNetKey("");
    setAutomationUrl("");
    await load();
  }

  async function createToken(e: FormEvent) {
    e.preventDefault();
    const res = await api<{ token: string }>("/api/tokens", {
      method: "POST",
      body: JSON.stringify({ name: tokenName }),
    });
    setNewToken(res.token);
    setMsg("API-Token erzeugt – einmalig kopieren.");
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

      <section className="panel stack" style={{ marginBottom: "1rem" }}>
        <h3>{t.mode.title}</h3>
        <p className="muted">{t.mode.hint}</p>
        <div className="row">
          <button
            type="button"
            className={`btn ${mode === "local" ? "" : "secondary"}`}
            onClick={() => {
              setMode("local");
              setModeState("local");
              setMsg("Local-Modus aktiv – Seite neu laden.");
            }}
          >
            {t.mode.local}
          </button>
          <button
            type="button"
            className={`btn ${mode === "server" ? "" : "secondary"}`}
            onClick={() => {
              setMode("server");
              setModeState("server");
              setMsg("Server-Modus aktiv – API-URL setzen und neu laden.");
            }}
          >
            {t.mode.server}
          </button>
        </div>
        {mode === "server" ? (
          <label className="field">
            API-Basis-URL (leer = gleiche Origin)
            <input
              value={apiBase}
              onChange={(e) => setApiBaseState(e.target.value)}
              placeholder="http://192.168.1.10:8787"
            />
          </label>
        ) : null}
        <div className="row">
          <span className="muted">{t.lang}</span>
          <button type="button" className={`btn secondary ${lang === "de" ? "active-lang" : ""}`} onClick={() => setLang("de")}>
            DE
          </button>
          <button type="button" className={`btn secondary ${lang === "en" ? "active-lang" : ""}`} onClick={() => setLang("en")}>
            EN
          </button>
        </div>
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            setApiBase(apiBase);
            window.location.reload();
          }}
        >
          Speichern & neu laden
        </button>
      </section>

      <section className="panel stack" style={{ marginBottom: "1rem" }}>
        <h3>{t.sync.title}</h3>
        <div className="row wrap">
          <button
            type="button"
            className="btn"
            onClick={() =>
              void pushLocalToServer()
                .then((r) => setMsg(`Push OK · ${r.upserted} Einträge`))
                .catch((e: Error) => setMsg(e.message))
            }
          >
            {t.sync.push}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() =>
              void pullServerToLocal()
                .then(() => setMsg("Pull OK – Local ersetzt. Neu laden empfohlen."))
                .catch((e: Error) => setMsg(e.message))
            }
          >
            {t.sync.pull}
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              void buildLocalSnapshot().then((snap) =>
                downloadJson(`hortis-local-${new Date().toISOString().slice(0, 10)}.json`, snap),
              )
            }
          >
            {t.sync.exportFile}
          </button>
          <label className="btn secondary" style={{ cursor: "pointer" }}>
            {t.sync.importFile}
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void file.text().then(async (txt) => {
                  const snap = JSON.parse(txt) as HortisSyncV1;
                  await applySnapshotToLocal(snap);
                  setMsg("Import OK – neu laden.");
                });
              }}
            />
          </label>
        </div>
      </section>

      <section className="panel stack" style={{ marginBottom: "1rem" }}>
        <h3>Theme</h3>
        <p className="muted">Workspace-Look wie bei HortusFox — wird serverseitig gespeichert.</p>
        <div className="theme-switch">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              className={theme === t.id ? "active" : ""}
              onClick={() => void setTheme(t.id as ThemeId)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

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

      <section className="panel stack" style={{ marginTop: "1rem" }}>
        <h3>PlantNet & Automationen</h3>
        <label className="field">
          PlantNet API-Key {s.hasPlantNetKey ? "(gesetzt)" : ""}
          <input
            type="password"
            value={plantNetKey}
            onChange={(e) => setPlantNetKey(e.target.value)}
            placeholder="für Pflanzenerkennung"
          />
        </label>
        <label className="field">
          Automation-Webhook {s.hasAutomationWebhook ? "(gesetzt)" : ""}
          <input
            value={automationUrl}
            onChange={(e) => setAutomationUrl(e.target.value)}
            placeholder="https://homeassistant.local/api/webhook/..."
          />
        </label>
        <form className="row" onSubmit={createToken}>
          <label className="field">
            API-Token Name
            <input value={tokenName} onChange={(e) => setTokenName(e.target.value)} />
          </label>
          <button className="btn secondary">Token erzeugen</button>
        </form>
        {newToken ? (
          <pre className="guide-md">Bearer {newToken}</pre>
        ) : (
          <p className="muted">Hook: POST /api/hooks/care mit Bearer hortis_…</p>
        )}
        <button
          className="btn"
          type="button"
          onClick={() => {
            void (async () => {
              await api("/api/settings", {
                method: "PATCH",
                body: JSON.stringify({
                  ...(plantNetKey ? { plantNetApiKey: plantNetKey } : {}),
                  ...(automationUrl ? { automationWebhookUrl: automationUrl } : {}),
                }),
              });
              setPlantNetKey("");
              setAutomationUrl("");
              setMsg("Integrationen gespeichert.");
              await load();
            })();
          }}
        >
          PlantNet/Webhook speichern
        </button>
      </section>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
