import { FormEvent, useEffect, useState } from "react";
import { api, getMode, getToken } from "../api";

type Location = { id: string; name: string; kind: string };
type Plant = {
  id: string;
  name: string;
  species: string;
  locationId: string | null;
  notes: string;
  photoUrl?: string | null;
  wateringProfile?: string;
  lightNeeds?: string;
  humidity?: string;
  soilMix?: string;
  healthStatus?: string;
  scientificName?: string;
  commonName?: string;
};

export function IndoorPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selected, setSelected] = useState<Plant | null>(null);
  const [events, setEvents] = useState<{ id: string; eventType: string; performedAt: string }[]>([]);
  const [photos, setPhotos] = useState<{ id: string; url: string; caption: string }[]>([]);
  const [guides, setGuides] = useState<{ id: string; title: string; summary: string }[]>([]);
  const [form, setForm] = useState({
    name: "",
    species: "",
    locationId: "",
    wateringProfile: "gleichmäßig feucht",
    lightNeeds: "hell, keine Mittagssonne",
    humidity: "mittel",
    soilMix: "lockere Blumenerde + Perlite",
    healthStatus: "ok",
  });

  async function refresh() {
    const [l, p, g] = await Promise.all([
      api<{ locations: Location[] }>("/api/locations"),
      api<{ plants: Plant[] }>("/api/plants?kind=indoor"),
      api<{ guides: { id: string; title: string; summary: string }[] }>("/api/guides?pillar=indoor"),
    ]);
    setLocations(l.locations);
    setPlants(p.plants);
    setGuides(g.guides);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function addLocation(e: FormEvent) {
    e.preventDefault();
    const name = (new FormData(e.target as HTMLFormElement).get("loc") as string) || "";
    await api("/api/locations", {
      method: "POST",
      body: JSON.stringify({ name, kind: "room", notes: "" }),
    });
    (e.target as HTMLFormElement).reset();
    await refresh();
  }

  async function addPlant(e: FormEvent) {
    e.preventDefault();
    await api("/api/plants", {
      method: "POST",
      body: JSON.stringify({
        kind: "indoor",
        name: form.name,
        species: form.species,
        locationId: form.locationId || null,
        tags: [],
        notes: "",
        wateringProfile: form.wateringProfile,
        lightNeeds: form.lightNeeds,
        humidity: form.humidity,
        soilMix: form.soilMix,
        healthStatus: form.healthStatus,
      }),
    });
    setForm({ ...form, name: "", species: "" });
    await refresh();
  }

  async function openPlant(plant: Plant) {
    setSelected(plant);
    const [ev, ph] = await Promise.all([
      api<{ events: typeof events }>(`/api/plants/${plant.id}/events`),
      api<{ photos: typeof photos }>(`/api/plants/${plant.id}/photos`),
    ]);
    setEvents(ev.events);
    setPhotos(ph.photos);
  }

  async function saveDetails(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const res = await api<{ plant: Plant }>(`/api/plants/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        wateringProfile: selected.wateringProfile,
        lightNeeds: selected.lightNeeds,
        humidity: selected.humidity,
        soilMix: selected.soilMix,
        healthStatus: selected.healthStatus,
        notes: selected.notes,
        species: selected.species,
        scientificName: selected.scientificName,
        commonName: selected.commonName,
      }),
    });
    setSelected(res.plant);
    await refresh();
  }

  async function logCare(eventType: string) {
    if (!selected) return;
    await api("/api/events", {
      method: "POST",
      body: JSON.stringify({ plantId: selected.id, eventType, note: "" }),
    });
    const ev = await api<{ events: typeof events }>(`/api/plants/${selected.id}/events`);
    setEvents(ev.events);
  }

  async function uploadPhoto(file: File) {
    if (!selected) return;
    if (getMode() === "local") {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      await api(`/api/plants/${selected.id}/photos`, {
        method: "POST",
        body: JSON.stringify({ dataUrl }),
      });
    } else {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/plants/${selected.id}/photos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body,
      });
      if (!res.ok) throw new Error("Upload fehlgeschlagen");
    }
    const ph = await api<{ photos: typeof photos }>(`/api/plants/${selected.id}/photos`);
    setPhotos(ph.photos);
    await openPlant({ ...selected });
    await refresh();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Zimmerpflanzen</h1>
          <p>Sammlung mit Standorten, Pflegeprofilen und Galerie – wie HortusFox, self-hosted.</p>
        </div>
      </div>

      <div className="plant-gallery">
        {plants.map((p) => (
          <button key={p.id} className="plant-card" onClick={() => void openPlant(p)}>
            <div
              className="plant-card-media"
              style={{
                backgroundImage: p.photoUrl ? `url(${p.photoUrl})` : undefined,
              }}
            />
            <div className="plant-card-body">
              <strong>{p.name}</strong>
              <span className="muted">{p.species || "Art offen"}</span>
              <span className={`badge ${p.healthStatus === "sick" ? "danger" : ""}`}>
                {p.healthStatus || "ok"}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid cols-2" style={{ marginTop: "1rem" }}>
        <section className="panel stack">
          <h3>Neue Pflanze</h3>
          <form className="stack" onSubmit={addPlant}>
            <label className="field">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field">Art<input value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} /></label>
            <label className="field">Standort
              <select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
                <option value="">—</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label className="field">Gießprofil<input value={form.wateringProfile} onChange={(e) => setForm({ ...form, wateringProfile: e.target.value })} /></label>
            <label className="field">Licht<input value={form.lightNeeds} onChange={(e) => setForm({ ...form, lightNeeds: e.target.value })} /></label>
            <button className="btn">Anlegen</button>
          </form>
          <form className="row" onSubmit={addLocation}>
            <label className="field">Standort<input name="loc" required /></label>
            <button className="btn secondary">+ Raum</button>
          </form>
        </section>

        <section className="panel stack">
          <h3>{selected ? selected.name : "Detailkarte"}</h3>
          {!selected ? (
            <p className="muted">Karte wählen – dann Profil, Fotos und Quick-Care.</p>
          ) : (
            <>
              <form className="stack" onSubmit={saveDetails}>
                <div className="row">
                  <button type="button" className="btn" onClick={() => void logCare("water")}>Gießen</button>
                  <button type="button" className="btn secondary" onClick={() => void logCare("fertilize")}>Düngen</button>
                  <button type="button" className="btn secondary" onClick={() => void logCare("mist")}>Besprühen</button>
                  <button type="button" className="btn secondary" onClick={() => void logCare("pest")}>Schädling</button>
                </div>
                <label className="field">Wissenschaftlich<input value={selected.scientificName || ""} onChange={(e) => setSelected({ ...selected, scientificName: e.target.value })} /></label>
                <label className="field">Gießprofil<input value={selected.wateringProfile || ""} onChange={(e) => setSelected({ ...selected, wateringProfile: e.target.value })} /></label>
                <label className="field">Licht<input value={selected.lightNeeds || ""} onChange={(e) => setSelected({ ...selected, lightNeeds: e.target.value })} /></label>
                <label className="field">Luftfeuchte<input value={selected.humidity || ""} onChange={(e) => setSelected({ ...selected, humidity: e.target.value })} /></label>
                <label className="field">Substrat<input value={selected.soilMix || ""} onChange={(e) => setSelected({ ...selected, soilMix: e.target.value })} /></label>
                <label className="field">Status
                  <select value={selected.healthStatus || "ok"} onChange={(e) => setSelected({ ...selected, healthStatus: e.target.value })}>
                    <option value="ok">ok</option>
                    <option value="watch">beobachten</option>
                    <option value="sick">krank</option>
                    <option value="dormant">Ruhe</option>
                  </select>
                </label>
                <label className="field">Notizen<textarea value={selected.notes || ""} onChange={(e) => setSelected({ ...selected, notes: e.target.value })} /></label>
                <button className="btn">Profil speichern</button>
              </form>
              <div className="row">
                <button type="button" className="btn secondary" onClick={() => void api(`/api/plants/${selected.id}/clone`, { method: "POST" }).then(refresh)}>
                  Klonen
                </button>
                <button type="button" className="btn danger" onClick={() => void api(`/api/plants/${selected.id}/archive`, { method: "POST", body: JSON.stringify({ reason: "archived" }) }).then(async () => { setSelected(null); await refresh(); })}>
                  Archivieren
                </button>
              </div>
              {selected.locationId ? (
                <div className="row">
                  <button type="button" className="btn secondary" onClick={() => void api(`/api/locations/${selected.locationId}/bulk-care`, { method: "POST", body: JSON.stringify({ eventType: "water" }) })}>
                    Standort gießen
                  </button>
                  <button type="button" className="btn secondary" onClick={() => void api(`/api/locations/${selected.locationId}/bulk-care`, { method: "POST", body: JSON.stringify({ eventType: "fertilize" }) })}>
                    Standort düngen
                  </button>
                </div>
              ) : null}
              <label className="field">
                Foto hochladen
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPhoto(f);
                }} />
              </label>
              <div className="photo-row">
                {photos.map((p) => (
                  <img key={p.id} src={p.url} alt="" />
                ))}
              </div>
              <h4>Letzte Pflege</h4>
              <ul className="list">
                {events.slice(0, 8).map((e) => (
                  <li key={e.id}>
                    <span>{e.eventType}</span>
                    <span className="muted">{new Date(e.performedAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Guides Zimmer</h3>
        <div className="guide-chips">
          {guides.map((g) => (
            <div key={g.id} className="chip">
              <strong>{g.title}</strong>
              <span className="muted">{g.summary}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
