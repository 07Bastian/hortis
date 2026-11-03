export type Guide = {
  id: string;
  pillar: "indoor" | "bonsai" | "garden" | "general";
  title: string;
  summary: string;
  body: string;
};

export const GUIDES: Guide[] = [
  {
    id: "indoor-watering",
    pillar: "indoor",
    title: "Zimmerpflanzen richtig gießen",
    summary: "Fingerprobe, Drainagelöcher, und warum „alle X Tage“ oft falsch ist.",
    body: `## Grundsatz
Gieße erst, wenn die oberen 2–3 cm Substrat trocken sind (Fingerprobe). Staunässe tötet mehr Pflanzen als Trockenheit.

## Checkliste
- Topf mit Abzugloch?
- Untersetzer nach 20 Min. leeren
- Winter: Intervalle verlängern, weniger düngen
- Regen-/Luftfeuchte beachten (Hortis Reminder mit rain-aware)

## Typische Profile
- **Tropisch** (Monstera, Philodendron): gleichmäßig feucht, nie nass
- **Sukkulenten**: stark austrocknen lassen
- **Farne**: hohe Luftfeuchte, nie komplett austrocknen`,
  },
  {
    id: "indoor-light",
    pillar: "indoor",
    title: "Licht am Fenster",
    summary: "Ost/West/Süd und was „hell“ wirklich bedeutet.",
    body: `## Orientierung
- **Nord**: schattenverträglich (Sansevieria, Zamioculcas)
- **Ost/West**: viele Grünpflanzen
- **Süd**: Kakteen, Sukkulenten; Blattpflanzen ggf. mit Gardine

## Tipps
Drehe Töpfe wöchentlich. Blattverfärbung nach innen = oft Lichtmangel.`,
  },
  {
    id: "bonsai-wire",
    pillar: "bonsai",
    title: "Draht und Timing",
    summary: "Wann verdrahten, wann entfernen, Narben vermeiden.",
    body: `## Regeln
- Junges Holz im späten Frühjahr verdrahten
- Draht vor dem Einwachsen entfernen (Hortis warnt bei „wired until“)
- Aluminium für Laub, Kupfer oft für Nadelgehölz
- Nie gegen die Rinde sägen – bei Widerstand neu setzen

## Saison (gemäßigtes Klima)
Feb Struktur, Mär/Apr Umtopfen, Apr/Mai Draht, Jun–Aug Pinzieren, Aug/Sep Draht prüfen.`,
  },
  {
    id: "bonsai-styles",
    pillar: "bonsai",
    title: "Klassische Stile",
    summary: "Chokkan, Moyogi, Kengai und wann welcher Stil passt.",
    body: `## Stile in Hortis
- **Chokkan**: streng aufrecht – starke Spitze, gleichmäßige Verjüngung
- **Moyogi**: informell aufrecht – natürlichste Wahl für Anfänger
- **Shakan**: geneigt
- **Kengai / Han-Kengai**: Kaskade / Halbkaskade – hohe Schale
- **Bunjingi**: literarisch, sparsam belaubt
- **Yose-ue**: Gruppe/Wald

Wähle den Stil nach Stammbewegung, nicht gegen das Holz.`,
  },
  {
    id: "bonsai-repot",
    pillar: "bonsai",
    title: "Umtopfen & Substrat",
    summary: "Akadama, Bims, Lava – und Wurzelschnitt mit Maß.",
    body: `## Timing
Laubgehölze meist bei Knospenbeginn. Immergrüne vorsichtiger.

## Substrat-Beispiele
- Laub: Akadama / Bims / Lava 50/25/25
- Nadel: mehr Akadama, gute Drainage
- Indoor-Tropen: etwas organischer Anteil möglich

Nach dem Umtopfen Schatten, Windschutz, erst düngen wenn Wachstum sichtbar.`,
  },
  {
    id: "garden-rotation",
    pillar: "garden",
    title: "Fruchtfolge verstehen",
    summary: "Familien nicht zu früh auf denselben Beetstellen wiederholen.",
    body: `## Warum
Bodenmüdigkeit und Krankheiten (z. B. Kohlhernie, Phytophthora) häufen sich.

## Hortis-Regel
Gleiche botanische Familie auf überlappenden Zellen innerhalb von 3 Jahren → Warnung.

## Grobe Gruppen
Starkzehrer (Kohl, Tomate) → Mittel → Schwach / Leguminosen zur Erholung.`,
  },
  {
    id: "garden-companions",
    pillar: "garden",
    title: "Mischkultur",
    summary: "Gute und schlechte Nachbarn im Beetplan.",
    body: `## Beispiele
- Gut: Möhre + Zwiebel, Tomate + Basilikum, Bohne + Mais
- Schlecht: Bohne + Zwiebel, Kartoffel + Tomate dicht, Kohl auf Kohl

Hortis bewertet benachbarte Pflanzungen über die Familien-Matrix (Beet Anything / Gardener).`,
  },
  {
    id: "garden-seeds",
    pillar: "garden",
    title: "Saatgut lagern",
    summary: "Kühl, trocken, beschriftet – Keimfähigkeit im Blick.",
    body: `## Lagerung
Dunkel, trocken, möglichst unter 15 °C. Tütchen mit Jahr und Sorte beschriften.

## Hortis
Saatgut-Inventar mit Menge, Familie und Erntejahr – vor der Beetplanung prüfen.`,
  },
  {
    id: "notify-channels",
    pillar: "general",
    title: "Erinnerungen per Mail, Telegram, Signal, Push",
    summary: "Kanäle in den Einstellungen aktivieren.",
    body: `## Kanäle
- **Mail**: SMTP-Host, Port, Absender
- **Telegram**: Bot-Token + Chat-ID
- **Signal**: Webhook-URL (z. B. signal-cli-rest-api)
- **Web-Push**: VAPID-Schlüssel generieren, im Browser abonnieren

Überfällige Pflege kann unter Einstellungen als Testnachricht ausgelöst werden.`,
  },
  {
    id: "local-sync",
    pillar: "general",
    title: "Local-Modus & Sync",
    summary: "APK ohne Server, Push/Pull zum Homelab.",
    body: `## Local
Daten liegen in IndexedDB. Standard auf der APK.

## Sync
Einstellungen → Sync: Local→Server pushen, Server→Local ziehen, oder JSON-Datei.

Format: \`hortis-sync-v1\`.`,
  },
  {
    id: "garden-rotation-suggest",
    pillar: "garden",
    title: "Fruchtfolge-Vorschläge",
    summary: "Nächste Saison nach Blatt→Frucht→Wurzel→Leguminose.",
    body: `## Regel
Familien 3 Jahre meiden. Zyklus: Leguminose → Blatt → Frucht → Wurzel.

Vorschläge nutzen zuerst Saatgut im Besitz, sonst den Sortenkatalog. Unter Garten → Fruchtfolge-Vorschläge übernehmen.`,
  },
  {
    id: "garden-seed-generations",
    pillar: "garden",
    title: "Saatgut-Generationen",
    summary: "Kauf, Vermehrung, Lizenz, DE/EN/Latein.",
    body: `## Felder
- Namen DE / EN / Latein
- Lizenz: op, f1, oss, pvr
- Gekauft am, Vermehrt am, Generation, Elternsaat

„Vermehren“ legt Generation+1 an. F1 sollte nicht weitervermehrt werden.`,
  },
  {
    id: "disease-gbif",
    pillar: "general",
    title: "Krankheits-Check & GBIF",
    summary: "PlantNet Blattmodus und Arten-Anreicherung.",
    body: `## Krankheit
Kollaboration → identify → Krankheit (Blatt). Keine Diagnose, nur Art-/Hinweis.

## GBIF
Kollaboration → gbif: wissenschaftliche und vernakuläre Namen suchen.`,
  },
  {
    id: "pwa-proxy",
    pillar: "general",
    title: "PWA & HTTPS-Proxy",
    summary: "Installierbare Web-App hinter Caddy/nginx.",
    body: `## PWA
Browser „Installieren“ / Manifest. Offline-Shell über Service Worker.

## Proxy
Siehe docs/proxy.md – TLS vor Port 8787.`,
  },
];

export function getGuide(id: string): Guide | undefined {
  return GUIDES.find((g) => g.id === id);
}
