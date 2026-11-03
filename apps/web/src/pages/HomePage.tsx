import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type ReminderStatus = {
  reminder: { plantId: string; eventType: string };
  overdueDays: number;
  suppressedByRain: boolean;
};

export function HomePage() {
  const [weather, setWeather] = useState<{
    temperatureC: number | null;
    rainMmNext24h: number;
    label?: string;
    lat?: number;
    lon?: number;
  } | null>(null);
  const [overdue, setOverdue] = useState<ReminderStatus[]>([]);
  const [counts, setCounts] = useState({ indoor: 0, bonsai: 0, beds: 0, seeds: 0, tasks: 0 });
  const [photos, setPhotos] = useState<{ id: string; name: string; photoUrl: string | null }[]>([]);

  useEffect(() => {
    void (async () => {
      const [w, r, indoor, bonsai, beds, seeds, tasks] = await Promise.all([
        api<{ temperatureC: number | null; rainMmNext24h: number; label: string; lat: number; lon: number }>("/api/weather"),
        api<{ statuses: ReminderStatus[] }>("/api/reminders/status"),
        api<{ plants: { id: string; name: string; photoUrl?: string | null }[] }>("/api/plants?kind=indoor"),
        api<{ plants: { id: string; name: string; photoUrl?: string | null }[] }>("/api/plants?kind=bonsai"),
        api<{ beds: unknown[] }>("/api/beds"),
        api<{ seeds: unknown[] }>("/api/seeds"),
        api<{ tasks: { done: boolean }[] }>("/api/tasks"),
      ]);
      setWeather(w);
      setOverdue(r.statuses.filter((s) => s.overdueDays > 0));
      setCounts({
        indoor: indoor.plants.length,
        bonsai: bonsai.plants.length,
        beds: beds.beds.length,
        seeds: seeds.seeds.length,
        tasks: tasks.tasks.filter((t) => !t.done).length,
      });
      setPhotos(
        [...indoor.plants, ...bonsai.plants]
          .filter((p) => p.photoUrl)
          .slice(0, 6)
          .map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl || null })),
      );
    })();
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dein Grünraum</h1>
          <p>Sammlung, Pflege und Beetplanung – self-hosted wie HortusFox & OlsGrow.</p>
        </div>
      </div>

      <section className="hero-strip panel">
        <div>
          <div className="muted">Wetter · {weather?.label || "Standort"}</div>
          <div className="hero-temp">
            {weather?.temperatureC != null ? `${weather.temperatureC}°` : "—"}
          </div>
          <div className="muted">
            Regen 24h: {weather?.rainMmNext24h ?? "—"} mm
            {weather?.lat != null ? ` · ${weather.lat.toFixed(3)}, ${weather.lon?.toFixed(3)}` : ""}
          </div>
          <Link className="btn secondary" to="/settings" style={{ marginTop: 12, display: "inline-flex" }}>
            Standort ändern
          </Link>
        </div>
        <div className="hero-stats">
          <div><strong>{counts.indoor}</strong><span>Zimmer</span></div>
          <div><strong>{counts.bonsai}</strong><span>Bonsai</span></div>
          <div><strong>{counts.beds}</strong><span>Beete</span></div>
          <div><strong>{counts.tasks}</strong><span>offen</span></div>
        </div>
      </section>

      <div className="grid cols-3" style={{ marginTop: "1rem" }}>
        <Link className="panel pillar-link" to="/indoor">
          <h2>Zimmer</h2>
          <p className="muted">Standorte, Profile, Galerie, Quick-Care</p>
        </Link>
        <Link className="panel pillar-link" to="/bonsai">
          <h2>Bonsai</h2>
          <p className="muted">Stil, Draht, Saison, Maße, Fotos</p>
        </Link>
        <Link className="panel pillar-link" to="/garden">
          <h2>Garten</h2>
          <p className="muted">Beete, Saatgut, Fruchtfolge</p>
        </Link>
      </div>

      <div className="grid cols-2" style={{ marginTop: "1rem" }}>
        <section className="panel">
          <h3>Heute fällig</h3>
          {overdue.length === 0 ? (
            <p className="muted">Alles im grünen Bereich.</p>
          ) : (
            <ul className="list">
              {overdue.slice(0, 8).map((s, i) => (
                <li key={i}>
                  <span>{s.reminder.eventType}{s.suppressedByRain ? " · Regen" : ""}</span>
                  <span className="badge danger">{s.overdueDays}d</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h3>Galerie</h3>
          {photos.length === 0 ? (
            <p className="muted">Noch keine Fotos – in Zimmer/Bonsai hochladen.</p>
          ) : (
            <div className="photo-row">
              {photos.map((p) => (
                <img key={p.id} src={p.photoUrl || ""} alt={p.name} title={p.name} />
              ))}
            </div>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn secondary" to="/guides">Guides</Link>
            <Link className="btn secondary" to="/settings">Benachrichtigungen</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
