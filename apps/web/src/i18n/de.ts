export const de = {
  brandSub: "Sammlung · Pflege · Beet",
  nav: {
    home: "Übersicht",
    indoor: "Zimmer",
    bonsai: "Bonsai",
    garden: "Garten",
    grow: "Grow",
    guides: "Guides",
    collab: "Kollaboration",
    ops: "Aufgaben",
    settings: "Einstellungen",
  },
  logout: "Abmelden",
  loading: "Lade Hortis…",
  login: {
    title: "Anmelden",
    email: "E-Mail",
    password: "Passwort",
    submit: "Einloggen",
    localHint: "Local-Modus: admin@hortis.local / hortis-admin-change-me",
  },
  mode: {
    title: "Betriebsmodus",
    local: "Local (ohne Server)",
    server: "Server",
    hint: "Local: APK/Gerät ohne Server (IndexedDB). Server: Sync, Push, PlantNet über Homelab.",
  },
  sync: {
    title: "Sync & Backup",
    push: "Local → Server pushen",
    pull: "Server → Local ziehen",
    exportFile: "JSON exportieren",
    importFile: "JSON importieren",
  },
  garden: {
    title: "Garten & Selbstversorgung",
    subtitle: "Beete, Saatgut, Fruchtfolge und Sortenkatalog",
    seeds: "Saatgut im Besitz",
    catalog: "Sortenkatalog",
    suggest: "Fruchtfolge-Vorschläge",
    applySuggest: "Vorschläge übernehmen",
    propagate: "Vermehren",
    generation: "Generation",
    license: "Lizenz",
  },
  install: "App installieren",
  lang: "Sprache",
};

type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export type Dict = DeepString<typeof de>;
