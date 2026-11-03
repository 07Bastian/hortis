/** Companion matrix inspired by Beet Anything / Gardener. */
const GOOD: Record<string, string[]> = {
  solanaceae: ["lamiaceae", "asteraceae"],
  brassicaceae: ["lamiaceae", "fabaceae"],
  fabaceae: ["brassicaceae", "apiaceae", "poaceae"],
  cucurbitaceae: ["fabaceae", "asteraceae"],
  apiaceae: ["fabaceae", "lamiaceae"],
  lamiaceae: ["solanaceae", "brassicaceae", "apiaceae"],
  alliaceae: ["solanaceae", "cucurbitaceae"],
  asteraceae: ["solanaceae", "cucurbitaceae"],
};

const BAD: Record<string, string[]> = {
  solanaceae: ["solanaceae", "cucurbitaceae"],
  brassicaceae: ["brassicaceae", "alliaceae"],
  fabaceae: ["alliaceae"],
  cucurbitaceae: ["solanaceae", "cucurbitaceae"],
  alliaceae: ["fabaceae", "brassicaceae"],
};

export type CompanionRelation = "good" | "bad" | "neutral";

export function companionRelation(a: string, b: string): CompanionRelation {
  const fa = a.toLowerCase();
  const fb = b.toLowerCase();
  if (!fa || !fb || fa === fb) return fa === fb ? "bad" : "neutral";
  if (GOOD[fa]?.includes(fb) || GOOD[fb]?.includes(fa)) return "good";
  if (BAD[fa]?.includes(fb) || BAD[fb]?.includes(fa)) return "bad";
  return "neutral";
}

export function normalizeFamily(name: string): string {
  const n = name.trim().toLowerCase();
  const aliases: Record<string, string> = {
    nachtschatten: "solanaceae",
    tomato: "solanaceae",
    tomate: "solanaceae",
    paprika: "solanaceae",
    kartoffel: "solanaceae",
    kohl: "brassicaceae",
    cabbage: "brassicaceae",
    bohnen: "fabaceae",
    erbsen: "fabaceae",
    kürbis: "cucurbitaceae",
    zucchini: "cucurbitaceae",
    gurke: "cucurbitaceae",
    möhre: "apiaceae",
    karotte: "apiaceae",
    sellerie: "apiaceae",
    basilikum: "lamiaceae",
    salbei: "lamiaceae",
    zwiebel: "alliaceae",
    knoblauch: "alliaceae",
    lauch: "alliaceae",
    salat: "asteraceae",
    sunflower: "asteraceae",
  };
  return aliases[n] ?? n;
}
