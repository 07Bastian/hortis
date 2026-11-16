import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n/context";

type GuideListItem = { id: string; pillar: string; title: string; summary: string };
type Guide = GuideListItem & { body: string };

export function GuidesPage() {
  const { t, lang } = useI18n();
  const [list, setList] = useState<GuideListItem[]>([]);
  const [pillar, setPillar] = useState("");
  const [active, setActive] = useState<Guide | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [askBusy, setAskBusy] = useState(false);
  const [askErr, setAskErr] = useState("");
  const [hasAi, setHasAi] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams();
    if (pillar) q.set("pillar", pillar);
    q.set("lang", lang);
    void api<{ guides: GuideListItem[] }>(`/api/guides?${q}`).then((r) => {
      setList(r.guides);
      setActive(null);
    });
  }, [pillar, lang]);

  useEffect(() => {
    void api<{ settings: { hasLlmKey?: boolean } }>("/api/settings")
      .then((r) => setHasAi(Boolean(r.settings.hasLlmKey)))
      .catch(() => setHasAi(false));
  }, []);

  async function open(id: string) {
    const res = await api<{ guide: Guide }>(`/api/guides/${id}?lang=${lang}`);
    setActive(res.guide);
  }

  async function ask(e: FormEvent) {
    e.preventDefault();
    setAskBusy(true);
    setAskErr("");
    setAnswer("");
    try {
      const res = await api<{ answer: string; model: string }>("/api/guides/ask", {
        method: "POST",
        body: JSON.stringify({
          question,
          pillar: pillar || undefined,
          lang,
        }),
      });
      setAnswer(res.answer);
    } catch (err) {
      setAskErr(err instanceof Error ? err.message : String(err));
    } finally {
      setAskBusy(false);
    }
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
        <section className="panel stack">
          <h3>{lang === "en" ? "Topics" : "Themen"}</h3>
          {list.length === 0 ? (
            <p className="muted">{lang === "en" ? "No guides in this filter." : "Keine Guides in diesem Filter."}</p>
          ) : (
            <ul className="list">
              {list.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    className={`linkish guide-list-btn ${active?.id === g.id ? "active-guide" : ""}`}
                    onClick={() => void open(g.id)}
                  >
                    <strong>{g.title}</strong>
                    <span className="muted small">{g.summary}</span>
                  </button>
                  <span className="badge">{g.pillar}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel guide-body stack">
          {!active ? (
            <p className="muted">
              {lang === "en"
                ? "Pick a guide on the left to read it."
                : "Links einen Guide wählen, um ihn zu lesen."}
            </p>
          ) : (
            <>
              <h2>{active.title}</h2>
              <p className="muted">{active.summary}</p>
              <pre className="guide-md">{active.body}</pre>
            </>
          )}
        </section>
      </div>

      <section className="panel stack" style={{ marginTop: "1rem" }}>
        <h3>{lang === "en" ? "Ask Hortis (optional AI)" : "Hortis fragen (optionale KI)"}</h3>
        <p className="muted">
          {lang === "en"
            ? "Uses your OpenAI-compatible key from Settings. Static guides work offline without AI."
            : "Nutzt den OpenAI-kompatiblen Key aus den Einstellungen. Die festen Guides funktionieren offline ohne KI."}
        </p>
        {!hasAi ? (
          <p className="badge warn">
            {lang === "en"
              ? "No AI key configured yet — open Settings → AI assistant."
              : "Noch kein KI-Key — Einstellungen → KI-Assistent."}
          </p>
        ) : null}
        <form className="stack" onSubmit={ask}>
          <label className="field">
            {lang === "en" ? "Question" : "Frage"}
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              required
              minLength={3}
              placeholder={
                lang === "en"
                  ? "e.g. My monstera has yellow lower leaves — what should I check?"
                  : "z. B. Meine Monstera hat gelbe untere Blätter – was prüfen?"
              }
            />
          </label>
          <button className="btn" disabled={askBusy || !hasAi}>
            {askBusy ? "…" : lang === "en" ? "Ask" : "Fragen"}
          </button>
        </form>
        {askErr ? <div className="badge danger">{askErr}</div> : null}
        {answer ? <pre className="guide-md">{answer}</pre> : null}
      </section>
    </div>
  );
}
