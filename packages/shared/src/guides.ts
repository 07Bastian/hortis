export type GuidePillar = "indoor" | "bonsai" | "garden" | "general";

export type Guide = {
  id: string;
  pillar: GuidePillar;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  body: string;
  bodyEn: string;
};

export const GUIDES: Guide[] = [
  {
    id: "indoor-watering",
    pillar: "indoor",
    title: "Zimmerpflanzen richtig gießen",
    titleEn: "Watering houseplants well",
    summary: "Fingerprobe, Drainage und warum feste Intervalle oft scheitern.",
    summaryEn: "Finger test, drainage, and why fixed schedules often fail.",
    body: `## Grundsatz
Gieße erst, wenn die oberen 2–3 cm Substrat trocken sind (Fingerprobe). Staunässe tötet mehr Pflanzen als kurze Trockenheit.

## Checkliste vor dem Gießen
1. Topf mit Abzugloch?
2. Gewicht des Topfes vergleichen (leicht = eher trocken)
3. Untersetzer nach 10–20 Minuten leeren
4. Im Winter Intervalle verlängern, weniger düngen

## Profile
- **Tropisch** (Monstera, Philodendron, Calathea): gleichmäßig feucht, nie nass
- **Sukkulenten / Kakteen**: stark austrocknen lassen
- **Farne**: hohe Luftfeuchte, Wurzelballen nicht austrocknen
- **Mittelmeer** (Oliven, Rosmarin): trockenere Pausen, hell und luftig

## Häufige Fehler
Zu viel gießen „aus Liebe“, kaltes Leitungswasser auf empfindliche Wurzeln, und Gießen nach Kalender statt nach Substrat.`,
    bodyEn: `## Rule of thumb
Water only when the top 2–3 cm of mix are dry. Soggy soil kills more plants than short drought.

## Checklist
1. Drainage hole present?
2. Compare pot weight (light ≈ dry)
3. Empty saucer after 10–20 minutes
4. In winter: longer intervals, less fertilizer

## Profiles
- **Tropical**: evenly moist, never wet
- **Succulents/cacti**: dry thoroughly between waterings
- **Ferns**: humidity + never bone-dry roots
- **Mediterranean**: brighter, airier, drier pauses

## Common mistakes
Watering by calendar, cold shock on roots, and leaving pots in standing water.`,
  },
  {
    id: "indoor-light",
    pillar: "indoor",
    title: "Licht am Fenster",
    titleEn: "Window light",
    summary: "Ost/West/Süd und was „hell“ wirklich bedeutet.",
    summaryEn: "East/west/south and what “bright” really means.",
    body: `## Orientierung
- **Nord**: schattenverträglich (Sansevieria, Zamioculcas, Aspidistra)
- **Ost**: sanftes Morgenlicht – ideal für viele Blattpflanzen
- **West**: stärkeres Nachmittagslicht – beobachten, ob Blätter brennen
- **Süd**: Kakteen/Sukkulenten; Blattpflanzen oft mit Gardine

## Praktisch
Töpfe wöchentlich drehen. Lange Internodien und blasse Blätter = meist Lichtmangel. Braune Flecken auf Sonnen-Seite = oft zu hartes Direktlicht.

## Kunstlicht
Vollspektrum-LEDs 30–60 cm Abstand, 10–14 h/Tag für lichtbedürftige Arten im Winter.`,
    bodyEn: `## Aspects
- **North**: low-light plants
- **East**: gentle morning light
- **West**: stronger afternoon light
- **South**: cactus/succulents; foliage often needs a sheer curtain

## Practice
Rotate pots weekly. Leggy pale growth ≈ light deficit. Scorch on the sunny side ≈ too harsh direct sun.

## Grow lights
Full-spectrum LEDs 30–60 cm away, 10–14 h/day in dark winters.`,
  },
  {
    id: "indoor-humidity",
    pillar: "indoor",
    title: "Luftfeuchte & Standortklima",
    titleEn: "Humidity & microclimate",
    summary: "Heizung, Luftzug und warum Gruppieren hilft.",
    summaryEn: "Heating, drafts, and why grouping helps.",
    body: `## Zielbereiche
- Tropische Blattpflanzen: oft 50–70 % relative Feuchte
- Sukkulenten: eher trocken, gute Luftbewegung
- Winterheizung trocknet stark – Calatheas und Farne reagieren zuerst

## Maßnahmen
Pflanzen gruppieren, Schalen mit Tongranulat, Luftbefeuchter, Abstand zur Heizung. Besprühen hilft der Luft kurz, ersetzt aber kein gleichmäßiges Klima.

## Luftzug
Kalte Fensterbank nachts + Heizungsluft tags = Stress. Bei Frost Fensterfolie oder nach innen rücken.`,
    bodyEn: `## Targets
- Tropical foliage: often 50–70% RH
- Succulents: drier air + airflow
- Winter heating dries rooms fast — Calathea/ferns show it first

## Fixes
Group plants, pebble trays, humidifier, keep off radiators. Misting is brief relief, not a climate.

## Drafts
Cold glass at night + dry heat by day = stress. Pull plants inward in hard frost.`,
  },
  {
    id: "indoor-soil-pests",
    pillar: "indoor",
    title: "Substrat, Umtopfen, Schädlinge",
    titleEn: "Soil, repotting, pests",
    summary: "Wann umtopfen, Trauermücken und Spinnmilben erkennen.",
    summaryEn: "When to repot, fungus gnats and spider mites.",
    body: `## Umtopfen
Meist alle 1–2 Jahre im Frühjahr, wenn Wurzeln den Topf ausfüllen oder Substrat zusammensackt. Nur 2–4 cm größer wählen.

## Substrat
Durchlässig mischen: torfreduzierte Erde + Perlite/Bims. Für Aroids oft etwas Rindenchips.

## Schädlinge (schnell)
- **Trauermücken**: feuchtes Substrat – antrocknen, gelbe Fallen, ggf. Nematoden
- **Spinnmilben**: feine Gespinste, punktierte Blätter – Luftfeuchte erhöhen, abduschen, bei Bedarf Raubmilben
- **Schildläuse**: festsitzende Schilde – mechanisch entfernen, Ölpräparate nach Etikett

Karenzzeiten bei Mitteln in Hortis beachten, bevor du „Ernte“ an Zimmerkräutern buchst.`,
    bodyEn: `## Repotting
Usually every 1–2 years in spring when roots fill the pot. Size up only 2–4 cm.

## Mix
Free-draining: peat-reduced soil + perlite/pumice. Aroids like some bark chips.

## Pests
- **Fungus gnats**: let mix dry, yellow traps, nematodes if needed
- **Spider mites**: fine webbing — raise humidity, rinse, predatory mites
- **Scale**: scrape + horticultural oil per label

Respect treatment waiting times before harvesting indoor herbs.`,
  },
  {
    id: "indoor-fertilizer",
    pillar: "indoor",
    title: "Düngen im Zimmer",
    titleEn: "Feeding indoors",
    summary: "Wachstumsschub ja, Salzstress nein.",
    summaryEn: "Support growth without salt stress.",
    body: `## Wann
März–September bei aktivem Wachstum. Im Winter pausieren oder stark verdünnen (außer bei starker Kunstlichtkultur).

## Wie
Flüssigdünger eher halb so stark wie angegeben, lieber regelmäßig. Nach dem Umtopfen 4–6 Wochen warten, wenn Frischerde vorgedüngt ist.

## Symptome
Blattränder braun + weiße Kruste im Topf = oft Salze → mit klarem Wasser durchspülen.`,
    bodyEn: `## When
March–September while actively growing. Pause or dilute heavily in winter (unless under strong grow lights).

## How
Liquid feed at about half strength, more often. After repotting wait 4–6 weeks if the mix is pre-fertilized.

## Signs
Brown leaf edges + white crust ≈ salts — flush with clear water.`,
  },
  {
    id: "bonsai-wire",
    pillar: "bonsai",
    title: "Draht und Timing",
    titleEn: "Wiring and timing",
    summary: "Wann verdrahten, wann entfernen, Narben vermeiden.",
    summaryEn: "When to wire, when to remove, avoid scars.",
    body: `## Regeln
- Junges Holz oft im späten Frühjahr verdrahten
- Draht vor dem Einwachsen entfernen
- Aluminium für viele Laubgehölze, Kupfer häufiger bei Nadelgehölz
- Nie gegen die Rinde sägen

## Saison (gemäßigt)
Feb Struktur, Mär/Apr Umtopfen, Apr/Mai Draht, Jun–Aug Pinzieren, Aug/Sep Draht prüfen.`,
    bodyEn: `## Rules
- Wire younger wood often in late spring
- Remove before wire bites in
- Aluminium for many deciduous; copper often for conifers
- Never saw into bark

## Temperate season
Feb structure, Mar/Apr repot, Apr/May wire, Jun–Aug pinch, Aug/Sep check wire.`,
  },
  {
    id: "bonsai-styles",
    pillar: "bonsai",
    title: "Klassische Stile",
    titleEn: "Classic styles",
    summary: "Chokkan, Moyogi, Kengai – Stil nach dem Holz wählen.",
    summaryEn: "Chokkan, Moyogi, Kengai — choose style from the wood.",
    body: `## Stile
- **Chokkan**: streng aufrecht
- **Moyogi**: informell aufrecht – gute Anfängerwahl
- **Shakan**: geneigt
- **Kengai / Han-Kengai**: Kaskade / Halbkaskade
- **Bunjingi**: sparsam, literarisch
- **Yose-ue**: Gruppe/Wald

Wähle nach Stammbewegung, nicht gegen das Holz.`,
    bodyEn: `## Styles
- **Chokkan**: formal upright
- **Moyogi**: informal upright — great starter
- **Shakan**: slanting
- **Kengai / Han-Kengai**: cascade / semi-cascade
- **Bunjingi**: literati, sparse
- **Yose-ue**: group/forest

Follow the trunk’s movement.`,
  },
  {
    id: "bonsai-repot",
    pillar: "bonsai",
    title: "Umtopfen & Substrat",
    titleEn: "Repotting & substrate",
    summary: "Akadama, Bims, Lava – Wurzelschnitt mit Maß.",
    summaryEn: "Akadama, pumice, lava — measured root work.",
    body: `## Timing
Laubgehölze meist bei Knospenbeginn. Immergrüne vorsichtiger.

## Mischungen
- Laub: Akadama/Bims/Lava etwa 50/25/25
- Nadel: mehr Drainage betonen
Nach dem Umtopfen Schatten, Windschutz; düngen erst bei sichtbarem Wachstum.`,
    bodyEn: `## Timing
Deciduous often at bud swell. Evergreens more carefully.

## Mixes
- Deciduous: akadama/pumice/lava ≈ 50/25/25
- Conifers: emphasize drainage
Aftercare: shade, wind shelter; feed only when growth resumes.`,
  },
  {
    id: "garden-rotation",
    pillar: "garden",
    title: "Fruchtfolge verstehen",
    titleEn: "Crop rotation basics",
    summary: "Familien nicht zu früh auf denselben Stellen wiederholen.",
    summaryEn: "Don’t repeat families too soon on the same spots.",
    body: `## Warum
Bodenmüdigkeit und Krankheiten häufen sich.

## Hortis-Regel
Gleiche Familie auf überlappenden Zellen innerhalb von 3 Jahren → Warnung.

## Gruppen
Starkzehrer → Mittel → Schwach/Leguminosen. Unter Garten → Fruchtfolge-Vorschläge nutzen.`,
    bodyEn: `## Why
Soil fatigue and disease build up.

## Hortis rule
Same family on overlapping cells within 3 years → warning.

## Groups
Heavy feeders → medium → light/legumes. Use Garden → rotation suggestions.`,
  },
  {
    id: "garden-companions",
    pillar: "garden",
    title: "Mischkultur",
    titleEn: "Companion planting",
    summary: "Gute und schlechte Nachbarn im Beet.",
    summaryEn: "Good and bad bed neighbors.",
    body: `## Beispiele
- Gut: Möhre + Zwiebel, Tomate + Basilikum, Bohne + Mais
- Schlecht: Bohne + Zwiebel eng, Kartoffel + Tomate dicht, Kohl auf Kohl

Hortis bewertet Nachbarschaften über die Familien-Matrix.`,
    bodyEn: `## Examples
- Good: carrot + onion, tomato + basil, bean + corn
- Bad: bean + onion tight, potato + tomato dense, brassica on brassica

Hortis scores neighbors via the family matrix.`,
  },
  {
    id: "garden-seeds",
    pillar: "garden",
    title: "Saatgut lagern & Generationen",
    titleEn: "Seed storage & generations",
    summary: "Kühl, trocken, beschriftet – Linie dokumentieren.",
    summaryEn: "Cool, dry, labeled — track lineage.",
    body: `## Lagerung
Dunkel, trocken, möglichst unter 15 °C. Jahr und Sorte beschriften.

## In Hortis
DE/EN/Latein, Lizenz (op/f1/oss/pvr), Kauf-/Vermehrungsdatum, Generation. „Vermehren“ legt Generation+1 an. F1 nicht weitervermehren.`,
    bodyEn: `## Storage
Dark, dry, ideally under 15 °C. Label year and variety.

## In Hortis
DE/EN/Latin, license, purchase/propagation dates, generation. Propagate creates generation+1. Don’t save F1 for true seed.`,
  },
  {
    id: "garden-rotation-suggest",
    pillar: "garden",
    title: "Fruchtfolge-Vorschläge nutzen",
    titleEn: "Using rotation suggestions",
    summary: "Zyklus Blatt→Frucht→Wurzel→Leguminose.",
    summaryEn: "Leaf→fruit→root→legume cycle.",
    body: `## Regel
Familien 3 Jahre meiden. Zyklus: Leguminose → Blatt → Frucht → Wurzel.

Vorschläge bevorzugen Saatgut im Besitz, sonst Katalog. Unter Garten übernehmen.`,
    bodyEn: `## Rule
Avoid families for 3 years. Cycle: legume → leaf → fruit → root.

Suggestions prefer owned seed, else catalog. Apply under Garden.`,
  },
  {
    id: "notify-channels",
    pillar: "general",
    title: "Erinnerungen einrichten",
    titleEn: "Set up reminders",
    summary: "Mail, Telegram, Signal, Push.",
    summaryEn: "Mail, Telegram, Signal, Push.",
    body: `## Kanäle
SMTP, Telegram-Bot, Signal-Webhook, Web-Push (VAPID). Testnachricht in den Einstellungen senden.`,
    bodyEn: `## Channels
SMTP, Telegram bot, Signal webhook, web push (VAPID). Send a test from Settings.`,
  },
  {
    id: "local-sync",
    pillar: "general",
    title: "Local-Modus & Sync",
    titleEn: "Local mode & sync",
    summary: "Offline auf dem Gerät, optional mit Server abgleichen.",
    summaryEn: "Offline on device, optionally sync with a server.",
    body: `## Local
Daten in IndexedDB – Standard auf der APK.

## Sync
Einstellungen → Sync: push/pull oder JSON (\`hortis-sync-v1\`).`,
    bodyEn: `## Local
Data in IndexedDB — default on the APK.

## Sync
Settings → Sync: push/pull or JSON (\`hortis-sync-v1\`).`,
  },
  {
    id: "disease-gbif",
    pillar: "general",
    title: "Bestimmung & GBIF",
    titleEn: "ID & GBIF",
    summary: "PlantNet und wissenschaftliche Namen.",
    summaryEn: "PlantNet and scientific names.",
    body: `## Krankheit / Blatt
Werkzeuge → identify → Krankheit (Blatt). Keine medizinische Diagnose.

## GBIF
Werkzeuge → gbif für wissenschaftliche/vernakuläre Namen.`,
    bodyEn: `## Leaf / disease mode
Tools → identify → disease (leaf). Not a medical diagnosis.

## GBIF
Tools → gbif for scientific/vernacular names.`,
  },
  {
    id: "pwa-proxy",
    pillar: "general",
    title: "PWA & HTTPS",
    titleEn: "PWA & HTTPS",
    summary: "App installieren und sicher hosten.",
    summaryEn: "Install the app and host it securely.",
    body: `## PWA
Browser „Installieren“. Offline-Shell über Service Worker.

## Proxy
docs/proxy.md – TLS vor Port 8787.`,
    bodyEn: `## PWA
Use the browser install prompt. Offline shell via service worker.

## Proxy
See docs/proxy.md — TLS in front of port 8787.`,
  },
  {
    id: "guide-ai",
    pillar: "general",
    title: "KI-Assistent für Pflegefragen",
    titleEn: "AI care assistant",
    summary: "Optionale API für konkrete Fragen zu deinen Pflanzen.",
    summaryEn: "Optional API for concrete questions about your plants.",
    body: `## Einrichtung
Einstellungen → KI-Assistent: Basis-URL (OpenAI-kompatibel), API-Key, Modell.

## Nutzung
Unter Guides Frage stellen. Antworten sind Hilfestellung, kein Ersatz für Beobachtung vor Ort.

Ohne Key bleiben die festen Guides offline verfügbar.`,
    bodyEn: `## Setup
Settings → AI assistant: OpenAI-compatible base URL, API key, model.

## Use
Ask under Guides. Advice is guidance, not a substitute for on-site observation.

Without a key, static guides still work offline.`,
  },
];

export function listGuides(pillar?: string): Guide[] {
  if (!pillar) return GUIDES;
  return GUIDES.filter((g) => g.pillar === pillar);
}

export function getGuide(id: string): Guide | undefined {
  return GUIDES.find((g) => g.id === id);
}

export function localizeGuide(g: Guide, lang: "de" | "en") {
  if (lang === "en") {
    return {
      id: g.id,
      pillar: g.pillar,
      title: g.titleEn,
      summary: g.summaryEn,
      body: g.bodyEn,
    };
  }
  return {
    id: g.id,
    pillar: g.pillar,
    title: g.title,
    summary: g.summary,
    body: g.body,
  };
}
