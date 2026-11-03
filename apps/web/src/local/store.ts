const DB_NAME = "hortis-local";
const DB_VERSION = 1;
const STORE = "kv";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? fallback);
    req.onerror = () => reject(req.error);
  });
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export type LocalDb = {
  users: {
    id: string;
    email: string;
    password: string;
    displayName: string;
    role: "admin" | "member";
  }[];
  locations: { id: string; name: string; kind: string; notes: string; sortOrder: number }[];
  plants: Record<string, unknown>[];
  events: Record<string, unknown>[];
  reminders: Record<string, unknown>[];
  bonsai: Record<string, unknown>[];
  beds: Record<string, unknown>[];
  seeds: Record<string, unknown>[];
  plantings: Record<string, unknown>[];
  inventory: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  chat: Record<string, unknown>[];
  calendar: Record<string, unknown>[];
  harvests: Record<string, unknown>[];
  photos: Record<string, unknown>[];
  settings: Record<string, unknown>;
  sessionUserId: string | null;
};

const EMPTY: LocalDb = {
  users: [],
  locations: [],
  plants: [],
  events: [],
  reminders: [],
  bonsai: [],
  beds: [],
  seeds: [],
  plantings: [],
  inventory: [],
  tasks: [],
  chat: [],
  calendar: [],
  harvests: [],
  photos: [],
  settings: {
    weatherLat: 47.6779,
    weatherLon: 11.2012,
    weatherLabel: "Murnau / Hof",
    theme: "forest",
  },
  sessionUserId: null,
};

export async function loadDb(): Promise<LocalDb> {
  const db = await kvGet<LocalDb>("db", EMPTY);
  if (!db.users.length) {
    db.users.push({
      id: crypto.randomUUID(),
      email: "admin@hortis.local",
      password: "hortis-admin-change-me",
      displayName: "Admin",
      role: "admin",
    });
    await saveDb(db);
  }
  return db;
}

export async function saveDb(db: LocalDb): Promise<void> {
  await kvSet("db", db);
}

export function uid(): string {
  return crypto.randomUUID();
}
