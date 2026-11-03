import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api";

type Bed = {
  id: string;
  name: string;
  widthCells: number;
  heightCells: number;
  year: number;
};
type Seed = { id: string; name: string; family: string; quantity: number; unit: string };
type Planting = {
  id: string;
  bedId: string;
  name: string;
  family: string;
  x: number;
  y: number;
  w: number;
  h: number;
  year: number;
  phase: string;
};

export function GardenPage() {
  const year = new Date().getFullYear();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [bedId, setBedId] = useState("");
  const [analysis, setAnalysis] = useState<{
    score: number;
    rotation: { message: string; severity: string }[];
    companions: { message: string; relation: string }[];
  } | null>(null);

  const [bedName, setBedName] = useState("");
  const [seedName, setSeedName] = useState("");
  const [seedFamily, setSeedFamily] = useState("solanaceae");
  const [plantName, setPlantName] = useState("");
  const [plantFamily, setPlantFamily] = useState("solanaceae");
  const [cellX, setCellX] = useState(0);
  const [cellY, setCellY] = useState(0);

  const activeBed = beds.find((b) => b.id === bedId) ?? null;

  const grid = useMemo(() => {
    if (!activeBed) return [];
    const cells: { x: number; y: number; planting?: Planting }[] = [];
    for (let y = 0; y < activeBed.heightCells; y++) {
      for (let x = 0; x < activeBed.widthCells; x++) {
        const planting = plantings.find(
          (p) =>
            p.bedId === activeBed.id &&
            x >= p.x &&
            x < p.x + p.w &&
            y >= p.y &&
            y < p.y + p.h,
        );
        cells.push({ x, y, planting });
      }
    }
    return cells;
  }, [activeBed, plantings]);

  async function refresh() {
    const [b, s, p] = await Promise.all([
      api<{ beds: Bed[] }>("/api/beds"),
      api<{ seeds: Seed[] }>("/api/seeds"),
      api<{ plantings: Planting[] }>(`/api/plantings?year=${year}`),
    ]);
    setBeds(b.beds);
    setSeeds(s.seeds);
    setPlantings(p.plantings);
    if (!bedId && b.beds[0]) setBedId(b.beds[0].id);
  }

  async function loadAnalysis(id: string) {
    const a = await api<{
      score: number;
      rotation: { message: string; severity: string }[];
      companions: { message: string; relation: string }[];
    }>(`/api/garden/analysis?bedId=${id}&year=${year}`);
    setAnalysis(a);
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (bedId) void loadAnalysis(bedId);
  }, [bedId, plantings]);

  async function addBed(e: FormEvent) {
    e.preventDefault();
    const res = await api<{ bed: Bed }>("/api/beds", {
      method: "POST",
      body: JSON.stringify({
        name: bedName,
        widthCells: 8,
        heightCells: 4,
        year,
        notes: "",
      }),
    });
    setBedName("");
    await refresh();
    setBedId(res.bed.id);
  }

  async function addSeed(e: FormEvent) {
    e.preventDefault();
    await api("/api/seeds", {
      method: "POST",
      body: JSON.stringify({
        name: seedName,
        family: seedFamily,
        species: "",
        quantity: 1,
        unit: "pkt",
        notes: "",
      }),
    });
    setSeedName("");
    await refresh();
  }

  async function addPlanting(e: FormEvent) {
    e.preventDefault();
    if (!bedId) return;
    await api("/api/plantings", {
      method: "POST",
      body: JSON.stringify({
        bedId,
        name: plantName,
        family: plantFamily,
        x: cellX,
        y: cellY,
        w: 1,
        h: 1,
        year,
        phase: "planned",
      }),
    });
    setPlantName("");
    await refresh();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Garten & Selbstversorgung</h1>
          <p>Beete, Saatgut, Fruchtfolge und Mischkultur (Gardener / Beet Anything).</p>
        </div>
      </div>

      <div className="grid cols-3">
        <section className="panel stack">
          <h3>Beet</h3>
          <form className="row" onSubmit={addBed}>
            <label className="field">
              Name
              <input value={bedName} onChange={(e) => setBedName(e.target.value)} required />
            </label>
            <button className="btn">Anlegen</button>
          </form>
          <label className="field">
            Aktiv
            <select value={bedId} onChange={(e) => setBedId(e.target.value)}>
              {beds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.year})
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="panel stack">
          <h3>Saatgut</h3>
          <form className="stack" onSubmit={addSeed}>
            <label className="field">
              Name
              <input value={seedName} onChange={(e) => setSeedName(e.target.value)} required />
            </label>
            <label className="field">
              Familie
              <input value={seedFamily} onChange={(e) => setSeedFamily(e.target.value)} />
            </label>
            <button className="btn">Eintragen</button>
          </form>
          <ul className="list">
            {seeds.map((s) => (
              <li key={s.id}>
                <span>{s.name}</span>
                <span className="badge">
                  {s.quantity} {s.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel stack">
          <h3>Analyse</h3>
          {analysis ? (
            <>
              <div className="badge">Score {analysis.score}/100</div>
              <ul className="list">
                {analysis.rotation.map((r, i) => (
                  <li key={`r${i}`}>
                    <span>{r.message}</span>
                    <span className="badge danger">{r.severity}</span>
                  </li>
                ))}
                {analysis.companions.map((c, i) => (
                  <li key={`c${i}`}>
                    <span>{c.message}</span>
                    <span className={`badge ${c.relation === "bad" ? "danger" : ""}`}>
                      {c.relation}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted">Kein Beet gewählt.</p>
          )}
        </section>
      </div>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Beetplan {activeBed?.name ?? ""}</h3>
        <form className="row" onSubmit={addPlanting}>
          <label className="field">
            Kultur
            <input value={plantName} onChange={(e) => setPlantName(e.target.value)} required />
          </label>
          <label className="field">
            Familie
            <input value={plantFamily} onChange={(e) => setPlantFamily(e.target.value)} />
          </label>
          <label className="field">
            X
            <input
              type="number"
              min={0}
              value={cellX}
              onChange={(e) => setCellX(Number(e.target.value))}
            />
          </label>
          <label className="field">
            Y
            <input
              type="number"
              min={0}
              value={cellY}
              onChange={(e) => setCellY(Number(e.target.value))}
            />
          </label>
          <button className="btn" disabled={!bedId}>
            Pflanzen
          </button>
        </form>
        {activeBed ? (
          <div
            className="bed-grid"
            style={{
              gridTemplateColumns: `repeat(${activeBed.widthCells}, minmax(0, 1fr))`,
            }}
          >
            {grid.map((cell) => (
              <div
                key={`${cell.x}-${cell.y}`}
                className={`bed-cell ${cell.planting ? "filled" : ""}`}
                title={cell.planting?.name}
              >
                {cell.planting?.name ?? ""}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
