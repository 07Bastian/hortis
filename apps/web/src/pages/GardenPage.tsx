import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n/context";

type Bed = {
  id: string;
  name: string;
  widthCells: number;
  heightCells: number;
  year: number;
};
type Seed = {
  id: string;
  name: string;
  nameDe?: string;
  nameEn?: string;
  nameLatin?: string;
  family: string;
  quantity: number;
  unit: string;
  license?: string;
  purchasedAt?: string | null;
  propagatedAt?: string | null;
  generation?: number;
  cultivarId?: string | null;
  parentSeedId?: string | null;
};
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
type Cultivar = {
  id: string;
  nameDe: string;
  nameEn: string;
  nameLatin: string;
  family: string;
  cropGroup: string;
  defaultLicense: string;
};
type Suggestion = {
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  nameDe: string;
  nameEn: string;
  nameLatin: string;
  family: string;
  cropGroup: string;
  seedId: string | null;
  cultivarId: string | null;
  reason: string;
  score: number;
};

export function GardenPage() {
  const { t, lang } = useI18n();
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const [bedName, setBedName] = useState("");
  const [catalogQ, setCatalogQ] = useState("");
  const [catalog, setCatalog] = useState<Cultivar[]>([]);
  const [seedNameDe, setSeedNameDe] = useState("");
  const [seedNameEn, setSeedNameEn] = useState("");
  const [seedLatin, setSeedLatin] = useState("");
  const [seedFamily, setSeedFamily] = useState("solanaceae");
  const [seedLicense, setSeedLicense] = useState("op");
  const [seedPurchased, setSeedPurchased] = useState("");
  const [seedCultivarId, setSeedCultivarId] = useState<string | null>(null);
  const [plantName, setPlantName] = useState("");
  const [plantFamily, setPlantFamily] = useState("solanaceae");
  const [cellX, setCellX] = useState(0);
  const [cellY, setCellY] = useState(0);
  const [harvestName, setHarvestName] = useState("");
  const [harvestWeight, setHarvestWeight] = useState(0);
  const [harvests, setHarvests] = useState<
    { id: string; name: string; weightG: number | null; harvestedAt: string }[]
  >([]);
  const [optCrops, setOptCrops] = useState(
    "Tomate:solanaceae,Basilikum:lamiaceae,Bohne:fabaceae,Salat:asteraceae",
  );
  const [optMode, setOptMode] = useState<"fresh" | "fit">("fresh");
  const [optResult, setOptResult] = useState<{
    score: number;
    message: string;
    plantings: { name: string; x: number; y: number }[];
  } | null>(null);

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
    const [b, s, p, h] = await Promise.all([
      api<{ beds: Bed[] }>("/api/beds"),
      api<{ seeds: Seed[] }>("/api/seeds"),
      api<{ plantings: Planting[] }>(`/api/plantings?year=${year}`),
      api<{ harvests: typeof harvests }>("/api/harvest"),
    ]);
    setBeds(b.beds);
    setSeeds(s.seeds);
    setPlantings(p.plantings);
    setHarvests(h.harvests);
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

  async function loadSuggestions(id: string) {
    const res = await api<{ suggestions: Suggestion[] }>(
      `/api/garden/rotation-suggest?bedId=${id}&year=${year}`,
    );
    setSuggestions(res.suggestions);
  }

  async function searchCatalog(q: string) {
    setCatalogQ(q);
    const res = await api<{ cultivars: Cultivar[] }>(
      `/api/cultivars?q=${encodeURIComponent(q)}`,
    );
    setCatalog(res.cultivars);
  }

  useEffect(() => {
    void refresh();
    void searchCatalog("");
  }, []);

  useEffect(() => {
    if (bedId) {
      void loadAnalysis(bedId);
      void loadSuggestions(bedId);
    }
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

  function pickCultivar(c: Cultivar) {
    setSeedNameDe(c.nameDe);
    setSeedNameEn(c.nameEn);
    setSeedLatin(c.nameLatin);
    setSeedFamily(c.family);
    setSeedLicense(c.defaultLicense);
    setSeedCultivarId(c.id);
  }

  async function addSeed(e: FormEvent) {
    e.preventDefault();
    await api("/api/seeds", {
      method: "POST",
      body: JSON.stringify({
        name: seedNameDe || seedNameEn || seedLatin,
        nameDe: seedNameDe,
        nameEn: seedNameEn,
        nameLatin: seedLatin,
        family: seedFamily,
        species: seedLatin,
        quantity: 1,
        unit: "pkt",
        license: seedLicense,
        purchasedAt: seedPurchased || null,
        generation: 0,
        cultivarId: seedCultivarId,
        notes: "",
      }),
    });
    setSeedNameDe("");
    setSeedNameEn("");
    setSeedLatin("");
    setSeedCultivarId(null);
    setSeedPurchased("");
    await refresh();
  }

  async function propagate(id: string) {
    await api(`/api/seeds/${id}/propagate`, { method: "POST" });
    await refresh();
  }

  async function applySuggestions() {
    if (!bedId) return;
    for (const s of suggestions.slice(0, 12)) {
      await api("/api/plantings", {
        method: "POST",
        body: JSON.stringify({
          bedId,
          seedId: s.seedId,
          name: lang === "en" ? s.nameEn : s.nameDe,
          family: s.family,
          x: s.x,
          y: s.y,
          w: s.w,
          h: s.h,
          year,
          phase: "planned",
        }),
      });
    }
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
          <h1>{t.garden.title}</h1>
          <p>{t.garden.subtitle}</p>
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
          <h3>{t.garden.catalog}</h3>
          <label className="field">
            Suche DE / EN / Latein
            <input
              value={catalogQ}
              onChange={(e) => void searchCatalog(e.target.value)}
              placeholder="Tomate, pea, Solanum…"
            />
          </label>
          <ul className="list compact">
            {catalog.slice(0, 8).map((c) => (
              <li key={c.id}>
                <button type="button" className="linkish" onClick={() => pickCultivar(c)}>
                  <strong>{lang === "en" ? c.nameEn : c.nameDe}</strong>
                  <span className="muted"> · {c.nameLatin}</span>
                </button>
                <span className="badge">{c.defaultLicense}</span>
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

      <section className="panel stack" style={{ marginTop: "1rem" }}>
        <h3>{t.garden.seeds}</h3>
        <form className="grid cols-3" onSubmit={addSeed}>
          <label className="field">
            Name DE
            <input value={seedNameDe} onChange={(e) => setSeedNameDe(e.target.value)} required />
          </label>
          <label className="field">
            Name EN
            <input value={seedNameEn} onChange={(e) => setSeedNameEn(e.target.value)} />
          </label>
          <label className="field">
            Latein
            <input value={seedLatin} onChange={(e) => setSeedLatin(e.target.value)} />
          </label>
          <label className="field">
            Familie
            <input value={seedFamily} onChange={(e) => setSeedFamily(e.target.value)} />
          </label>
          <label className="field">
            {t.garden.license}
            <select value={seedLicense} onChange={(e) => setSeedLicense(e.target.value)}>
              <option value="op">op (offen abblühend)</option>
              <option value="f1">f1</option>
              <option value="oss">oss</option>
              <option value="pvr">pvr</option>
              <option value="unknown">unknown</option>
            </select>
          </label>
          <label className="field">
            Gekauft am
            <input
              type="date"
              value={seedPurchased}
              onChange={(e) => setSeedPurchased(e.target.value)}
            />
          </label>
          <button className="btn">Eintragen</button>
        </form>
        <ul className="list">
          {seeds.map((s) => (
            <li key={s.id}>
              <div>
                <strong>{lang === "en" ? s.nameEn || s.name : s.nameDe || s.name}</strong>
                <div className="muted small">
                  {s.nameLatin || s.name} · {s.family} · {t.garden.generation}{" "}
                  {s.generation ?? 0}
                  {s.purchasedAt ? ` · Kauf ${s.purchasedAt}` : ""}
                  {s.propagatedAt ? ` · Vermehrt ${s.propagatedAt}` : ""}
                </div>
              </div>
              <div className="row">
                <span className="badge">{s.license || "—"}</span>
                <span className="badge">
                  {s.quantity} {s.unit}
                </span>
                <button type="button" className="btn secondary" onClick={() => void propagate(s.id)}>
                  {t.garden.propagate}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel stack" style={{ marginTop: "1rem" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3>{t.garden.suggest}</h3>
          <button className="btn" type="button" disabled={!bedId || !suggestions.length} onClick={() => void applySuggestions()}>
            {t.garden.applySuggest}
          </button>
        </div>
        <ul className="list">
          {suggestions.slice(0, 10).map((s, i) => (
            <li key={`${s.x}-${s.y}-${i}`}>
              <span>
                ({s.x},{s.y}) {lang === "en" ? s.nameEn : s.nameDe}{" "}
                <span className="muted">· {s.nameLatin}</span>
                <div className="muted small">{s.reason}</div>
              </span>
              <span className="badge">{s.cropGroup}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel stack" style={{ marginTop: "1rem" }}>
        <h3>Layout-Optimizer</h3>
        <label className="field">
          Kulturen (Name:Familie, …)
          <input value={optCrops} onChange={(e) => setOptCrops(e.target.value)} />
        </label>
        <div className="row">
          <label className="field">
            Modus
            <select value={optMode} onChange={(e) => setOptMode(e.target.value as "fresh" | "fit")}>
              <option value="fresh">Fresh Garden</option>
              <option value="fit">Fit to Current</option>
            </select>
          </label>
          <button
            className="btn"
            disabled={!bedId}
            type="button"
            onClick={() => {
              const crops = optCrops
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p) => {
                  const [name, family] = p.split(":").map((x) => x.trim());
                  return { name, family: family || name };
                });
              void api<{
                score: number;
                message: string;
                plantings: { name: string; x: number; y: number }[];
              }>("/api/garden/optimize", {
                method: "POST",
                body: JSON.stringify({ bedId, mode: optMode, crops, apply: true }),
              }).then(async (r) => {
                setOptResult(r);
                await refresh();
              });
            }}
          >
            Optimieren & anwenden
          </button>
        </div>
        {optResult ? (
          <div className="badge">
            Score {optResult.score} · {optResult.message} · {optResult.plantings.length} Kulturen
          </div>
        ) : null}
      </section>

      <section className="panel stack" style={{ marginTop: "1rem" }}>
        <h3>Ernte-Log</h3>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void api("/api/harvest", {
              method: "POST",
              body: JSON.stringify({
                bedId: bedId || null,
                name: harvestName,
                weightG: harvestWeight || null,
                quality: "",
                notes: "",
              }),
            }).then(async () => {
              setHarvestName("");
              await refresh();
            });
          }}
        >
          <label className="field">
            Kultur
            <input value={harvestName} onChange={(e) => setHarvestName(e.target.value)} required />
          </label>
          <label className="field">
            Gewicht g
            <input
              type="number"
              value={harvestWeight}
              onChange={(e) => setHarvestWeight(Number(e.target.value))}
            />
          </label>
          <button className="btn">Ernte buchen</button>
        </form>
        <ul className="list">
          {harvests.slice(0, 8).map((h) => (
            <li key={h.id}>
              <span>{h.name}</span>
              <span className="badge">
                {h.weightG ?? "—"} g · {new Date(h.harvestedAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </section>

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
