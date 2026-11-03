import { FormEvent, useEffect, useState } from "react";
import { api, getToken } from "../api";

type Profile = {
  style: string;
  phase: string;
  potType: string;
  wiredUntil: string | null;
  trainingNotes: string;
  winterProtection: boolean;
  ageYears?: number | null;
  trunkDiameterCm?: number | null;
  nebariNotes?: string;
  speciesGroup?: string;
  outdoor?: boolean;
  nextWiringAt?: string | null;
  displayReady?: boolean;
  heightCm?: number | null;
};

type Item = {
  plant: {
    id: string;
    name: string;
    species: string;
    photoUrl?: string | null;
    soilMix?: string;
    healthStatus?: string;
  };
  profile: Profile | null;
  wireOverdue: boolean;
};

export function BonsaiPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({
    style: "moyogi",
    phase: "training",
    potType: "",
    wiredUntil: null,
    trainingNotes: "",
    winterProtection: false,
    ageYears: null,
    trunkDiameterCm: null,
    nebariNotes: "",
    speciesGroup: "laub",
    outdoor: true,
    nextWiringAt: null,
    displayReady: false,
    heightCm: null,
  });
  const [seasonal, setSeasonal] = useState<{ title: string; eventType: string }[]>([]);
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [guides, setGuides] = useState<{ id: string; title: string; summary: string }[]>([]);
  const [suggestRepot, setSuggestRepot] = useState<number | null>(null);

  async function refresh() {
    const [res, g] = await Promise.all([
      api<{ items: Item[] }>("/api/bonsai"),
      api<{ guides: typeof guides }>("/api/guides?pillar=bonsai"),
    ]);
    setItems(res.items);
    setGuides(g.guides);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function addBonsai(e: FormEvent) {
    e.preventDefault();
    const created = await api<{ plant: { id: string } }>("/api/plants", {
      method: "POST",
      body: JSON.stringify({
        kind: "bonsai",
        name,
        species,
        tags: ["bonsai"],
        notes: "",
        soilMix: "Akadama / Bims / Lava",
        wateringProfile: "bei Antrocknen",
        lightNeeds: "vollsonnig bis halbschattig",
      }),
    });
    await api(`/api/bonsai/${created.plant.id}`, {
      method: "PUT",
      body: JSON.stringify({
        style: "moyogi",
        phase: "training",
        potType: "",
        winterProtection: true,
        trainingNotes: "",
        speciesGroup: "laub",
        outdoor: true,
        displayReady: false,
      }),
    });
    setName("");
    setSpecies("");
    await refresh();
  }

  async function select(item: Item) {
    setSelectedId(item.plant.id);
    if (item.profile) setProfile({ ...profile, ...item.profile });
    const [season, ph] = await Promise.all([
      api<{ tasks: typeof seasonal; suggestRepotYears: number }>(
        `/api/bonsai/${item.plant.id}/season`,
      ).catch(() => ({ tasks: [] as typeof seasonal, suggestRepotYears: 2 })),
      api<{ photos: typeof photos }>(`/api/plants/${item.plant.id}/photos`),
    ]);
    setSeasonal(season.tasks);
    setSuggestRepot(season.suggestRepotYears);
    setPhotos(ph.photos);
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    const res = await api<{
      seasonal: typeof seasonal;
      suggestRepotYears: number;
    }>(`/api/bonsai/${selectedId}`, {
      method: "PUT",
      body: JSON.stringify({
        ...profile,
        wiredUntil: profile.wiredUntil || new Date(Date.now() + 90 * 86400000).toISOString(),
        nextWiringAt: profile.nextWiringAt || null,
        lastRepotAt: null,
      }),
    });
    setSeasonal(res.seasonal);
    setSuggestRepot(res.suggestRepotYears);
    await refresh();
  }

  async function log(eventType: string) {
    if (!selectedId) return;
    await api("/api/events", {
      method: "POST",
      body: JSON.stringify({ plantId: selectedId, eventType, note: "" }),
    });
  }

  async function uploadPhoto(file: File) {
    if (!selectedId) return;
    const body = new FormData();
    body.append("file", file);
    await fetch(`/api/plants/${selectedId}/photos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body,
    });
    const ph = await api<{ photos: typeof photos }>(`/api/plants/${selectedId}/photos`);
    setPhotos(ph.photos);
    await refresh();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Bonsai</h1>
          <p>Stil, Maße, Draht, Saisonarbeiten, Galerie und Guides.</p>
        </div>
      </div>

      <div className="plant-gallery">
        {items.map((item) => (
          <button key={item.plant.id} className="plant-card" onClick={() => void select(item)}>
            <div
              className="plant-card-media"
              style={{
                backgroundImage: item.plant.photoUrl ? `url(${item.plant.photoUrl})` : undefined,
              }}
            />
            <div className="plant-card-body">
              <strong>{item.plant.name}</strong>
              <span className="muted">
                {item.profile?.style || "—"} · {item.profile?.phase || "—"}
              </span>
              {item.wireOverdue ? <span className="badge danger">Draht fällig</span> : null}
            </div>
          </button>
        ))}
      </div>

      <div className="grid cols-2" style={{ marginTop: "1rem" }}>
        <section className="panel stack">
          <h3>Neuer Bonsai</h3>
          <form className="stack" onSubmit={addBonsai}>
            <label className="field">Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label className="field">Art<input value={species} onChange={(e) => setSpecies(e.target.value)} /></label>
            <button className="btn">Anlegen</button>
          </form>
          <h3>Guides</h3>
          <div className="guide-chips">
            {guides.map((g) => (
              <div key={g.id} className="chip">
                <strong>{g.title}</strong>
                <span className="muted">{g.summary}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <h3>Werkbank</h3>
          {!selectedId ? (
            <p className="muted">Bonsai-Karte wählen.</p>
          ) : (
            <>
              <form className="stack" onSubmit={saveProfile}>
                <div className="row">
                  <button type="button" className="btn" onClick={() => void log("water")}>Gießen</button>
                  <button type="button" className="btn secondary" onClick={() => void log("wire")}>Draht</button>
                  <button type="button" className="btn secondary" onClick={() => void log("unwire")}>Draht ab</button>
                  <button type="button" className="btn secondary" onClick={() => void log("prune")}>Schnitt</button>
                  <button type="button" className="btn secondary" onClick={() => void log("repot")}>Umtopfen</button>
                </div>
                <div className="row">
                  <label className="field">Stil
                    <select value={profile.style} onChange={(e) => setProfile({ ...profile, style: e.target.value })}>
                      {["chokkan","moyogi","shakan","kengai","han_kengai","bunjingi","sokan","yose_ue","other"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">Phase
                    <select value={profile.phase} onChange={(e) => setProfile({ ...profile, phase: e.target.value })}>
                      {["nursery","training","refinement","display","recovery"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="row">
                  <label className="field">Schale<input value={profile.potType} onChange={(e) => setProfile({ ...profile, potType: e.target.value })} /></label>
                  <label className="field">Höhe cm<input type="number" value={profile.heightCm ?? ""} onChange={(e) => setProfile({ ...profile, heightCm: e.target.value ? Number(e.target.value) : null })} /></label>
                  <label className="field">Alter J.<input type="number" value={profile.ageYears ?? ""} onChange={(e) => setProfile({ ...profile, ageYears: e.target.value ? Number(e.target.value) : null })} /></label>
                  <label className="field">Stamm Ø cm<input type="number" value={profile.trunkDiameterCm ?? ""} onChange={(e) => setProfile({ ...profile, trunkDiameterCm: e.target.value ? Number(e.target.value) : null })} /></label>
                </div>
                <label className="field">Artengruppe
                  <select value={profile.speciesGroup || ""} onChange={(e) => setProfile({ ...profile, speciesGroup: e.target.value })}>
                    <option value="laub">Laub</option>
                    <option value="nadel">Nadel</option>
                    <option value="tropisch">Tropisch / Indoor</option>
                  </select>
                </label>
                <label className="field">Nebari / Fuß<textarea value={profile.nebariNotes || ""} onChange={(e) => setProfile({ ...profile, nebariNotes: e.target.value })} /></label>
                <label className="field">Training<textarea value={profile.trainingNotes} onChange={(e) => setProfile({ ...profile, trainingNotes: e.target.value })} /></label>
                <label className="check">
                  <input type="checkbox" checked={!!profile.outdoor} onChange={(e) => setProfile({ ...profile, outdoor: e.target.checked })} />
                  Outdoor
                </label>
                <label className="check">
                  <input type="checkbox" checked={!!profile.winterProtection} onChange={(e) => setProfile({ ...profile, winterProtection: e.target.checked })} />
                  Winterschutz nötig
                </label>
                <label className="check">
                  <input type="checkbox" checked={!!profile.displayReady} onChange={(e) => setProfile({ ...profile, displayReady: e.target.checked })} />
                  Ausstellungsreif
                </label>
                <button className="btn">Profil speichern</button>
              </form>
              {suggestRepot != null ? (
                <div className="badge warn">Umtopf-Rhythmus ca. alle {suggestRepot} Jahre</div>
              ) : null}
              <label className="field">
                Foto
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPhoto(f);
                }} />
              </label>
              <div className="photo-row">
                {photos.map((p) => <img key={p.id} src={p.url} alt="" />)}
              </div>
              <h4>Saison jetzt</h4>
              <ul className="list">
                {seasonal.map((t, i) => (
                  <li key={i}>
                    <span>{t.title}</span>
                    <span className="badge">{t.eventType}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
