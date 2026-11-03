/** EC / fertilizer mixing helpers — Kamerplanter-inspired safety rules. */

export type WaterSource = "tap" | "ro" | "rain" | "mixed";

export interface MixInput {
  volumeL: number;
  targetEc: number;
  sourceEc: number;
  source: WaterSource;
  /** Nutrient salts in grams to dissolve (N-P-K style parts). */
  saltsG: { name: string; grams: number; order: number }[];
}

export interface MixResult {
  ok: boolean;
  warnings: string[];
  estimatedEc: number;
  addWaterL: number;
  mixOrder: string[];
  notes: string[];
}

const CALMAG = /cal|mag|ca\b|mg\b/i;
const SULFATE = /sulf|so4|epsom/i;

/** Rough: 1 ml/L of typical 1-part liquid ≈ 0.2–0.4 EC rise; we use salt grams ≈ 0.7 mS per g/L. */
export function estimateEcRise(grams: number, volumeL: number): number {
  if (volumeL <= 0) return 0;
  return (grams / volumeL) * 0.7;
}

export function planMix(input: MixInput): MixResult {
  const warnings: string[] = [];
  const notes: string[] = [];
  const salts = [...input.saltsG].sort((a, b) => a.order - b.order);

  // Mixing order safety: CalMag before sulfates
  const calIdx = salts.findIndex((s) => CALMAG.test(s.name));
  const sulIdx = salts.findIndex((s) => SULFATE.test(s.name));
  if (calIdx >= 0 && sulIdx >= 0 && calIdx > sulIdx) {
    warnings.push("CalMag sollte vor Sulfaten gemischt werden (Ausfällung).");
    salts.sort((a, b) => {
      const aCal = CALMAG.test(a.name) ? 0 : SULFATE.test(a.name) ? 2 : 1;
      const bCal = CALMAG.test(b.name) ? 0 : SULFATE.test(b.name) ? 2 : 1;
      return aCal - bCal || a.order - b.order;
    });
  }

  const totalG = salts.reduce((s, x) => s + x.grams, 0);
  const estimatedEc = input.sourceEc + estimateEcRise(totalG, input.volumeL);

  if (input.source === "ro" && input.sourceEc < 0.05 && !salts.some((s) => CALMAG.test(s.name))) {
    warnings.push("RO-Wasser: CalMag empfohlen, sonst Ca/Mg-Mangel.");
  }
  if (estimatedEc > input.targetEc + 0.3) {
    warnings.push(
      `Geschätztes EC ${estimatedEc.toFixed(2)} über Ziel ${input.targetEc.toFixed(2)} — verdünnen.`,
    );
  }

  let addWaterL = 0;
  if (estimatedEc > input.targetEc && input.targetEc > 0) {
    // dilution: C1*V1 = C2*V2
    const v2 = (estimatedEc * input.volumeL) / input.targetEc;
    addWaterL = Math.max(0, v2 - input.volumeL);
    notes.push(`Zum Erreichen von EC ${input.targetEc}: ca. ${addWaterL.toFixed(2)} L Wasser zugeben.`);
  }

  if (input.targetEc >= 2.5) {
    warnings.push("Hohes Ziel-EC (≥2.5): Verbrennungsrisiko bei Jungpflanzen.");
  }

  notes.push("Reihenfolge: Wasser → CalMag → Basisdünger → Sulfate → pH zuletzt prüfen.");

  return {
    ok: warnings.length === 0,
    warnings,
    estimatedEc: Math.round(estimatedEc * 100) / 100,
    addWaterL: Math.round(addWaterL * 100) / 100,
    mixOrder: salts.map((s) => `${s.name} (${s.grams}g)`),
    notes,
  };
}

export function flushProtocol(volumeL: number, currentEc: number): string[] {
  const steps = [
    `Tank ${volumeL} L mit klarem Wasser spülen (aktuell EC ${currentEc}).`,
    "1–2× Volumen durchlaufen lassen bis Ablauf-EC nahe Zulauf.",
    "Danach sanft neu anmischen (50–70% der normalen EC).",
  ];
  if (currentEc > 3) steps.unshift("Sehr hohes EC: zuerst 50% ablassen, dann auffüllen.");
  return steps;
}
