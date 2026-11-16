import { useEffect, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n/context";

type GuideListItem = { id: string; pillar: string; title: string; summary: string };
type Guide = GuideListItem & { body: string };

export function GuidesPage() {
  const { t } = useI18n();
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
          <h1>{t.guides.title}</h1>
          <p>{t.guides.subtitle}</p>
        </div>
        <select value={pillar} onChange={(e) => setPillar(e.target.value)}>
          <option value="">{t.guides.all}</option>
          <option value="indoor">{t.guides.indoor}</option>
          <option value="bonsai">{t.guides.bonsai}</option>
          <option value="garden">{t.guides.garden}</option>
          <option value="general">{t.guides.general}</option>
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
