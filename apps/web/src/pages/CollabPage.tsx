import { FormEvent, useEffect, useState } from "react";
import { api, getApiBase, getMode, getToken } from "../api";

type ChatMsg = { id: string; displayName: string; body: string; createdAt: string };
type CalEvent = {
  id: string;
  title: string;
  class: string;
  dateFrom: string;
  dateTill: string;
};
type Hist = { id: string; reason: string; archivedAt: string; plant: { name: string; kind: string } };

export function CollabPage() {
  const [tab, setTab] = useState<"search" | "chat" | "calendar" | "history" | "identify" | "gbif">(
    "search",
  );
  const [q, setQ] = useState("");
  const [search, setSearch] = useState<{
    plants: { id: string; name: string; kind: string }[];
    tasks: { id: string; title: string }[];
    seeds: { id: string; name: string }[];
  } | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatBody, setChatBody] = useState("");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [calTitle, setCalTitle] = useState("");
  const [calFrom, setCalFrom] = useState(new Date().toISOString().slice(0, 10));
  const [history, setHistory] = useState<Hist[]>([]);
  const [identify, setIdentify] = useState<string>("");
  const [idMode, setIdMode] = useState<"plant" | "disease">("plant");
  const [gbifQ, setGbifQ] = useState("");
  const [gbifHits, setGbifHits] = useState<
    { scientificName: string; vernacularName: string; rank: string }[]
  >([]);

  async function loadChat() {
    const res = await api<{ messages: ChatMsg[] }>("/api/chat");
    setMessages(res.messages);
  }
  async function loadCal() {
    const res = await api<{ events: CalEvent[] }>("/api/calendar");
    setEvents(res.events);
  }
  async function loadHist() {
    const res = await api<{ history: Hist[] }>("/api/history");
    setHistory(res.history);
  }

  useEffect(() => {
    if (tab === "chat") void loadChat();
    if (tab === "calendar") void loadCal();
    if (tab === "history") void loadHist();
  }, [tab]);

  async function doSearch(e: FormEvent) {
    e.preventDefault();
    const res = await api<NonNullable<typeof search>>(`/api/search?q=${encodeURIComponent(q)}`);
    setSearch(res);
  }

  async function sendChat(e: FormEvent) {
    e.preventDefault();
    await api("/api/chat", { method: "POST", body: JSON.stringify({ body: chatBody }) });
    setChatBody("");
    await loadChat();
  }

  async function addCal(e: FormEvent) {
    e.preventDefault();
    await api("/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        title: calTitle,
        class: "care",
        dateFrom: calFrom,
        dateTill: calFrom,
        notes: "",
      }),
    });
    setCalTitle("");
    await loadCal();
  }

  async function identifyFile(file: File) {
    const body = new FormData();
    body.append("file", file);
    const base = getMode() === "server" ? getApiBase() : "";
    const res = await fetch(`${base}/api/identify?mode=${idMode}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body,
    });
    const data = await res.json();
    if (!res.ok) {
      setIdentify(data.error || "Fehler");
      return;
    }
    const tip = data.tip ? `${data.tip}\n\n` : "";
    const results = data.result?.results?.slice(0, 5) || [];
    setIdentify(
      tip +
        (results
          .map(
            (r: {
              score: number;
              species: { scientificNameWithoutAuthor: string; commonNames?: string[] };
            }) =>
              `${Math.round(r.score * 100)}% · ${r.species.scientificNameWithoutAuthor}` +
              (r.species.commonNames?.[0] ? ` (${r.species.commonNames[0]})` : ""),
          )
          .join("\n") || "Keine Treffer"),
    );
  }

  async function searchGbif(e: FormEvent) {
    e.preventDefault();
    const res = await api<{
      results: { scientificName: string; vernacularName: string; rank: string }[];
    }>(`/api/species/gbif?q=${encodeURIComponent(gbifQ)}`);
    setGbifHits(res.results);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Kollaboration</h1>
          <p>Suche, Chat, Kalender, Historie und PlantNet-ID – HortusFox / OlsGrow.</p>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        {(["search", "chat", "calendar", "history", "identify", "gbif"] as const).map((t) => (
          <button
            key={t}
            className={`btn ${tab === t ? "" : "secondary"}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "search" ? (
        <section className="panel stack">
          <form className="row" onSubmit={doSearch}>
            <label className="field">
              Suche
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pflanze, Saatgut, Aufgabe…" />
            </label>
            <button className="btn">Suchen</button>
          </form>
          {search ? (
            <div className="grid cols-2">
              <div>
                <h3>Pflanzen</h3>
                <ul className="list">
                  {search.plants.map((p) => (
                    <li key={p.id}>
                      <span>{p.name}</span>
                      <span className="badge">{p.kind}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Aufgaben / Saatgut</h3>
                <ul className="list">
                  {search.tasks.map((t) => (
                    <li key={t.id}>{t.title}</li>
                  ))}
                  {search.seeds.map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "chat" ? (
        <section className="panel stack">
          <ul className="list">
            {messages.map((m) => (
              <li key={m.id}>
                <span>
                  <strong>{m.displayName}</strong>: {m.body}
                </span>
                <span className="muted">{new Date(m.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <form className="row" onSubmit={sendChat}>
            <label className="field">
              Nachricht
              <input value={chatBody} onChange={(e) => setChatBody(e.target.value)} required />
            </label>
            <button className="btn">Senden</button>
          </form>
        </section>
      ) : null}

      {tab === "calendar" ? (
        <section className="panel stack">
          <form className="row" onSubmit={addCal}>
            <label className="field">
              Titel
              <input value={calTitle} onChange={(e) => setCalTitle(e.target.value)} required />
            </label>
            <label className="field">
              Datum
              <input type="date" value={calFrom} onChange={(e) => setCalFrom(e.target.value)} />
            </label>
            <button className="btn">Eintrag</button>
          </form>
          <ul className="list">
            {events.map((ev) => (
              <li key={ev.id}>
                <span>{ev.title}</span>
                <span className="badge">{ev.dateFrom.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "history" ? (
        <section className="panel">
          <ul className="list">
            {history.map((h) => (
              <li key={h.id}>
                <span>
                  {h.plant.name} ({h.plant.kind})
                </span>
                <span className="muted">
                  {h.reason} · {new Date(h.archivedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "identify" ? (
        <section className="panel stack">
          <p className="muted">
            PlantNet-API-Key in den Einstellungen. Krankheitsmodus nutzt Blatt-Organ + Hinweis-Guide.
          </p>
          <div className="row">
            <button
              type="button"
              className={`btn ${idMode === "plant" ? "" : "secondary"}`}
              onClick={() => setIdMode("plant")}
            >
              Art
            </button>
            <button
              type="button"
              className={`btn ${idMode === "disease" ? "" : "secondary"}`}
              onClick={() => setIdMode("disease")}
            >
              Krankheit (Blatt)
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void identifyFile(f);
            }}
          />
          <pre className="guide-md">{identify || "Noch kein Ergebnis."}</pre>
        </section>
      ) : null}

      {tab === "gbif" ? (
        <section className="panel stack">
          <p className="muted">Artennamen über GBIF anreichern (wissenschaftlich / vernakulär).</p>
          <form className="row" onSubmit={searchGbif}>
            <label className="field">
              Art / Name
              <input value={gbifQ} onChange={(e) => setGbifQ(e.target.value)} required minLength={2} />
            </label>
            <button className="btn">GBIF suchen</button>
          </form>
          <ul className="list">
            {gbifHits.map((h, i) => (
              <li key={`${h.scientificName}-${i}`}>
                <span>
                  <strong>{h.scientificName}</strong>
                  {h.vernacularName ? ` · ${h.vernacularName}` : ""}
                </span>
                <span className="badge">{h.rank}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
