import { loadDb, saveDb, type LocalDb } from "./store";
import { getApiBase, getToken } from "../api";

export type HortisSyncV1 = {
  version: "hortis-sync-v1";
  exportedAt: string;
  locations: Record<string, unknown>[];
  plants: Record<string, unknown>[];
  events: Record<string, unknown>[];
  reminders: Record<string, unknown>[];
  bonsai: Record<string, unknown>[];
  beds: Record<string, unknown>[];
  seeds: Record<string, unknown>[];
  plantings: Record<string, unknown>[];
  inventory: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  calendar: Record<string, unknown>[];
  harvests: Record<string, unknown>[];
  photos?: Record<string, unknown>[];
  settings?: Record<string, unknown>;
};

export async function buildLocalSnapshot(): Promise<HortisSyncV1> {
  const db = await loadDb();
  return {
    version: "hortis-sync-v1",
    exportedAt: new Date().toISOString(),
    locations: db.locations as unknown as Record<string, unknown>[],
    plants: db.plants,
    events: db.events,
    reminders: db.reminders,
    bonsai: db.bonsai,
    beds: db.beds,
    seeds: db.seeds,
    plantings: db.plantings,
    inventory: db.inventory,
    tasks: db.tasks,
    calendar: db.calendar,
    harvests: db.harvests,
    photos: db.photos,
    settings: db.settings,
  };
}

export async function applySnapshotToLocal(snap: HortisSyncV1): Promise<void> {
  if (snap.version !== "hortis-sync-v1") throw new Error("Unsupported sync version");
  const db = await loadDb();
  const next: LocalDb = {
    ...db,
    locations: (snap.locations || []) as LocalDb["locations"],
    plants: snap.plants || [],
    events: snap.events || [],
    reminders: snap.reminders || [],
    bonsai: snap.bonsai || [],
    beds: snap.beds || [],
    seeds: snap.seeds || [],
    plantings: snap.plantings || [],
    inventory: snap.inventory || [],
    tasks: snap.tasks || [],
    calendar: snap.calendar || [],
    harvests: snap.harvests || [],
    photos: snap.photos || db.photos,
    settings: { ...db.settings, ...(snap.settings || {}) },
  };
  await saveDb(next);
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBase();
  if (!base) throw new Error("API-URL fehlt (Einstellungen → Server)");
  const headers = new Headers(init?.headers || {});
  if (!headers.has("Content-Type") && init?.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${base}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
  return data as T;
}

export async function pushLocalToServer(): Promise<{ upserted: number }> {
  const snap = await buildLocalSnapshot();
  return serverFetch("/api/sync/import", { method: "POST", body: JSON.stringify(snap) });
}

export async function pullServerToLocal(): Promise<void> {
  const snap = await serverFetch<HortisSyncV1>("/api/sync/export");
  await applySnapshotToLocal(snap);
}
