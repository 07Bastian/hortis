import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useI18n } from "../i18n/context";

type ReminderStatus = {
  reminder: { plantId: string; eventType: string };
  overdueDays: number;
  suppressedByRain: boolean;
};

export function HomePage() {
  const { t } = useI18n();
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
        tasks: tasks.tasks.filter((task) => !task.done).length,
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
          <h1>{t.home.title}</h1>
          <p>{t.home.subtitle}</p>
        </div>
      </div>

      <section className="hero-strip panel">
        <div>
          <div className="muted">
            {t.home.weather} · {weather?.label || t.home.location}
          </div>
          <div className="hero-temp">
            {weather?.temperatureC != null ? `${weather.temperatureC}°` : "—"}
          </div>
          <div className="muted">
            {t.home.rain24}: {weather?.rainMmNext24h ?? "—"} mm
            {weather?.lat != null ? ` · ${weather.lat.toFixed(3)}, ${weather.lon?.toFixed(3)}` : ""}
          </div>
          <div className="quick-actions">
            <Link className="btn secondary" to="/settings">
              {t.home.location}
            </Link>
            <Link className="btn secondary" to="/indoor">
              {t.home.addPlant}
            </Link>
            <Link className="btn secondary" to="/garden">
              {t.home.openBed}
            </Link>
            <Link className="btn secondary" to="/ops">
              {t.home.tasks}
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          <div>
            <strong>{counts.indoor}</strong>
            <span>{t.home.indoor}</span>
          </div>
          <div>
            <strong>{counts.bonsai}</strong>
            <span>{t.home.bonsai}</span>
          </div>
          <div>
            <strong>{counts.beds}</strong>
            <span>{t.home.beds}</span>
          </div>
          <div>
            <strong>{counts.seeds}</strong>
            <span>{t.home.seeds}</span>
          </div>
        </div>
      </section>

      <div className="grid cols-3" style={{ marginTop: "1rem" }}>
        <Link className="panel pillar-link" to="/indoor">
          <h2>{t.home.indoor}</h2>
          <p className="muted">{t.home.indoorHint}</p>
        </Link>
        <Link className="panel pillar-link" to="/bonsai">
          <h2>{t.home.bonsai}</h2>
          <p className="muted">{t.home.bonsaiHint}</p>
        </Link>
        <Link className="panel pillar-link" to="/garden">
          <h2>{t.nav.garden}</h2>
          <p className="muted">{t.home.gardenHint}</p>
        </Link>
      </div>
      <div className="grid cols-3" style={{ marginTop: "1rem" }}>
        <Link className="panel pillar-link" to="/grow">
          <h2>{t.home.grow}</h2>
          <p className="muted">{t.home.growHint}</p>
        </Link>
        <Link className="panel pillar-link" to="/collab">
          <h2>{t.home.tools}</h2>
          <p className="muted">{t.home.toolsHint}</p>
        </Link>
        <Link className="panel pillar-link" to="/guides">
          <h2>{t.home.guides}</h2>
          <p className="muted">{t.home.guidesHint}</p>
        </Link>
      </div>

      <div className="grid cols-2" style={{ marginTop: "1rem" }}>
        <section className="panel">
          <h3>{t.home.dueToday}</h3>
          {overdue.length === 0 ? (
            <p className="muted">{t.home.allGood}</p>
          ) : (
            <ul className="list">
              {overdue.slice(0, 8).map((s, i) => (
                <li key={i}>
                  <span>
                    {s.reminder.eventType}
                    {s.suppressedByRain ? ` · ${t.home.rain}` : ""}
                  </span>
                  <span className="badge danger">{s.overdueDays}d</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h3>{t.home.gallery}</h3>
          {photos.length === 0 ? (
            <p className="muted">{t.home.noPhotos}</p>
          ) : (
            <div className="photo-row">
              {photos.map((p) => (
                <img key={p.id} src={p.photoUrl || ""} alt={p.name} title={p.name} />
              ))}
            </div>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn secondary" to="/guides">
              {t.home.guides}
            </Link>
            <Link className="btn secondary" to="/settings">
              {t.home.notifications}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
