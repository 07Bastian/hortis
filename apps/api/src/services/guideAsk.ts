import { GUIDES } from "@hortis/shared";
import { getSettings } from "./settings.js";

export async function askGuideAssistant(input: {
  question: string;
  pillar?: string;
  lang?: "de" | "en";
}): Promise<{ answer: string; model: string }> {
  const s = getSettings();
  const key = s.llmApiKey?.trim();
  if (!key) {
    throw new Error("KI-API-Key fehlt (Einstellungen → KI-Assistent)");
  }
  const base = (s.llmBaseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = s.llmModel || "gpt-4o-mini";
  const lang = input.lang === "en" ? "en" : "de";
  const corpus = GUIDES.filter((g) => !input.pillar || g.pillar === input.pillar)
    .slice(0, 14)
    .map((g) => `# ${lang === "en" ? g.titleEn : g.title}\n${lang === "en" ? g.bodyEn : g.body}`)
    .join("\n\n");

  const system =
    lang === "en"
      ? "You are Hortis, a careful gardening assistant. Prefer the provided Hortis guide notes. Be concrete and cautious; say when you are unsure. No medical claims for humans."
      : "Du bist Hortis, ein vorsichtiger Garten-Assistent. Stütze dich auf die mitgelieferten Hortis-Guides. Sei konkret und vorsichtig; sage, wenn du unsicher bist. Keine medizinischen Aussagen für Menschen.";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            (lang === "en" ? "Guide notes:\n" : "Guide-Notizen:\n") +
            corpus +
            "\n\n" +
            (lang === "en" ? "Question: " : "Frage: ") +
            input.question,
        },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`LLM ${res.status}: ${detail.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = data.choices?.[0]?.message?.content?.trim() || "";
  if (!answer) throw new Error("Leere KI-Antwort");
  return { answer, model };
}
