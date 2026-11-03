import { useEffect, useState } from "react";
import { api } from "../api";

type GuideListItem = { id: string; pillar: string; title: string; summary: string };
type Guide = GuideListItem & { body: string };

export function GuidesPage() {
  const [list, setList] = useState<GuideListItem[]>([]);
  const [pillar, setPillar] = useState("");
  const [active, setActive] = useState<Guide | null>(null);

  useEffect(() => {
    const q = pillar ? `?pillar=${pillar}` : "";
    void api<{ guides: GuideListItem[] }>(`/api/guides${q}`).then((r) => setList(r.guides));
  }, [pillar]);

  async function open(id: string) {
    const res = await api<{ guide: Guide }>(`/api/guides/${id}`);
    setActive(res.guide);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Wissen & Guides</h1>
          <p>Pflegewissen zu Zimmer, Bonsai und Beet – direkt in Hortis.</p>
        </div>
        <select value={pillar} onChange={(e) => setPillar(e.target.value)}>
          <option value="">Alle</option>
          <option value="indoor">Zimmer</option>
          <option value="bonsai">Bonsai</option>
          <option value="garden">Garten</option>
          <option value="general">Allgemein</option>
        </select>
      </div>

      <div className="grid cols-2">
        <section className="panel">
          <ul className="list">
            {list.map((g) => (
              <li key={g.id}>
                <button className="btn secondary" onClick={() => void open(g.id)}>
                  {g.title}
                </button>
                <span className="badge">{g.pillar}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel guide-body">
          {!active ? (
            <p className="muted">Guide wählen.</p>
          ) : (
            <>
              <h2>{active.title}</h2>
              <p className="muted">{active.summary}</p>
              <pre className="guide-md">{active.body}</pre>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
