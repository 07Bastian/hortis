import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";

type GddItem = {
  plantingId: string;
  name: string;
  group: string;
  targetGdd: number;
  accumulatedGdd: number;
  phase: string;
  progress: number;
};

type MixResult = {
  ok: boolean;
  warnings: string[];
  estimatedEc: number;
  addWaterL: number;
  mixOrder: string[];
  notes: string[];
};

export function GrowPage() {
  const [gdd, setGdd] = useState<GddItem[]>([]);
  const [volumeL, setVolumeL] = useState(10);
  const [targetEc, setTargetEc] = useState(1.6);
  const [sourceEc, setSourceEc] = useState(0.3);
  const [source, setSource] = useState("tap");
  const [saltName, setSaltName] = useState("CalMag");
  const [saltG, setSaltG] = useState(5);
  const [salt2Name, setSalt2Name] = useState("Basis NPK");
  const [salt2G, setSalt2G] = useState(12);
  const [mix, setMix] = useState<MixResult | null>(null);
  const [flush, setFlush] = useState<string[]>([]);

  useEffect(() => {
    void api<{ items: GddItem[] }>("/api/grow/gdd/batch").then((r) => setGdd(r.items));
  }, []);

  async function calcMix(e: FormEvent) {
    e.preventDefault();
    const res = await api<{ mix: MixResult }>("/api/grow/mix", {
      method: "POST",
      body: JSON.stringify({
        volumeL,
        targetEc,
        sourceEc,
        source,
        saltsG: [
          { name: saltName, grams: saltG, order: 1 },
          { name: salt2Name, grams: salt2G, order: 2 },
        ],
      }),
    });
    setMix(res.mix);
  }

  async function doFlush() {
    const res = await api<{ steps: string[] }>("/api/grow/flush", {
      method: "POST",
      body: JSON.stringify({ volumeL, currentEc: mix?.estimatedEc ?? sourceEc }),
    });
    setFlush(res.steps);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Grow-Science</h1>
          <p>GDD-Phasen und EC-Mischrechner (Kamerplanter-Port, ohne Cluster).</p>
        </div>
      </div>

      <div className="grid cols-2">
        <section className="panel">
          <h3>GDD (30 Tage Wetter)</h3>
          {gdd.length === 0 ? (
            <p className="muted">Keine Pflanzungen dieses Jahr — im Garten anlegen.</p>
          ) : (
            <ul className="list">
              {gdd.map((g) => (
                <li key={g.plantingId}>
                  <span>
                    {g.name}
                    <div className="muted">
                      {g.accumulatedGdd}/{g.targetGdd} GDD · {g.group}
                    </div>
                    <div className="progress">
                      <div style={{ width: `${Math.round(g.progress * 100)}%` }} />
                    </div>
                  </span>
                  <span className="badge">{g.phase}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel stack">
          <h3>EC / Nährstoff-Mix</h3>
          <form className="stack" onSubmit={calcMix}>
            <div className="row">
              <label className="field">
                Volumen L
                <input type="number" step="0.1" value={volumeL} onChange={(e) => setVolumeL(Number(e.target.value))} />
              </label>
              <label className="field">
                Ziel-EC
                <input type="number" step="0.1" value={targetEc} onChange={(e) => setTargetEc(Number(e.target.value))} />
              </label>
              <label className="field">
                Quell-EC
                <input type="number" step="0.1" value={sourceEc} onChange={(e) => setSourceEc(Number(e.target.value))} />
              </label>
            </div>
            <label className="field">
              Wasser
              <select value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="tap">Leitung</option>
                <option value="ro">RO</option>
                <option value="rain">Regen</option>
                <option value="mixed">Gemischt</option>
              </select>
            </label>
            <div className="row">
              <label className="field">
                Salz 1
                <input value={saltName} onChange={(e) => setSaltName(e.target.value)} />
              </label>
              <label className="field">
                g
                <input type="number" value={saltG} onChange={(e) => setSaltG(Number(e.target.value))} />
              </label>
            </div>
            <div className="row">
              <label className="field">
                Salz 2
                <input value={salt2Name} onChange={(e) => setSalt2Name(e.target.value)} />
              </label>
              <label className="field">
                g
                <input type="number" value={salt2G} onChange={(e) => setSalt2G(Number(e.target.value))} />
              </label>
            </div>
            <div className="row">
              <button className="btn">Berechnen</button>
              <button type="button" className="btn secondary" onClick={() => void doFlush()}>
                Flush-Protokoll
              </button>
            </div>
          </form>
          {mix ? (
            <div className="stack">
              <div className={`badge ${mix.ok ? "" : "warn"}`}>
                EC ≈ {mix.estimatedEc}
                {mix.addWaterL > 0 ? ` · +${mix.addWaterL} L Wasser` : ""}
              </div>
              <div className="muted">Reihenfolge: {mix.mixOrder.join(" → ")}</div>
              {mix.warnings.map((w, i) => (
                <div key={i} className="badge danger">
                  {w}
                </div>
              ))}
              {mix.notes.map((n, i) => (
                <div key={i} className="muted">
                  {n}
                </div>
              ))}
            </div>
          ) : null}
          {flush.length ? (
            <ul className="list">
              {flush.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </div>
  );
}
