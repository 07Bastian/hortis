import { computeReminderStatus } from "@hortis/care-engine";
import {
  companionWarnings,
  layoutScore,
  optimizeLayout,
  rotationWarnings,
  searchCultivars,
  suggestRotation,
} from "@hortis/garden-engine";
import { loadDb, saveDb, uid, type LocalDb } from "./store";
import { applySnapshotToLocal, buildLocalSnapshot, type HortisSyncV1 } from "./sync";

type Res = { status: number; body?: unknown };

function ok(body?: unknown): Res {
  return { status: 200, body };
}
function noContent(): Res {
  return { status: 204 };
}
function err(status: number, error: string): Res {
  return { status, body: { error } };
}

function parseBody(options: RequestInit): unknown {
  if (!options.body) return undefined;
  if (typeof options.body === "string") {
    try {
      return JSON.parse(options.body);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function user(db: LocalDb) {
  return db.users.find((u) => u.id === db.sessionUserId) || null;
}

function requireUser(db: LocalDb): Res | null {
  if (!db.sessionUserId || !user(db)) return err(401, "Unauthorized");
  return null;
}

export async function handleLocal(path: string, options: RequestInit = {}): Promise<Res> {
  const method = (options.method || "GET").toUpperCase();
  const url = new URL(path, "http://local");
  const p = url.pathname;
  const db = await loadDb();
  const body = parseBody(options) as Record<string, unknown> | undefined;

  if (p === "/api/health") return ok({ ok: true, name: "hortis", version: "0.2.0", mode: "local" });

  if (p === "/api/auth/login" && method === "POST") {
    const email = String(body?.email || "");
    const password = String(body?.password || "");
    const found = db.users.find((u) => u.email === email && u.password === password);
    if (!found) return err(401, "Invalid credentials");
    db.sessionUserId = found.id;
    await saveDb(db);
    return ok({
      token: `local:${found.id}`,
      user: { id: found.id, email: found.email, role: found.role, displayName: found.displayName },
    });
  }

  if (p === "/api/auth/me") {
    const u = user(db);
    if (!u) return err(401, "Unauthorized");
    return ok({ user: { id: u.id, email: u.email, role: u.role, displayName: u.displayName } });
  }

  const authErr = requireUser(db);
  if (authErr && p.startsWith("/api/") && p !== "/api/auth/login") return authErr;
  const u = user(db)!;

  if (p === "/api/settings" && method === "GET") {
    return ok({
      settings: {
        ...db.settings,
        hasSmtpPass: false,
        hasTelegramToken: false,
        hasSignalWebhook: false,
        hasVapidPrivate: false,
        hasPlantNetKey: false,
        hasAutomationWebhook: false,
        vapidPublicKey: "",
        notifyMail: false,
        notifyTelegram: false,
        notifySignal: false,
        notifyPush: false,
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpFrom: "",
        smtpSecure: false,
        telegramChatId: "",
        signalWebhookUrl: "",
        vapidSubject: "",
      },
    });
  }
  if (p === "/api/settings" && method === "PATCH") {
    db.settings = { ...db.settings, ...body };
    await saveDb(db);
    return ok({ settings: db.settings });
  }

  if (p === "/api/weather") {
    const lat = Number(db.settings.weatherLat ?? 47.6779);
    const lon = Number(db.settings.weatherLon ?? 11.2012);
    const label = String(db.settings.weatherLabel || "Murnau / Hof");
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
        `&longitude=${lon}&current=temperature_2m,weather_code` +
        `&hourly=precipitation&forecast_days=1&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("weather");
      const data = (await res.json()) as {
        current?: { temperature_2m?: number; weather_code?: number };
        hourly?: { precipitation?: number[] };
      };
      const precip = data.hourly?.precipitation?.slice(0, 24) ?? [];
      const rainMm = precip.reduce((a, b) => a + (b || 0), 0);
      return ok({
        lat,
        lon,
        label,
        temperatureC: data.current?.temperature_2m ?? null,
        rainMmNext24h: Math.round(rainMm * 10) / 10,
        weatherCode: data.current?.weather_code ?? null,
        source: "open-meteo-direct",
      });
    } catch {
      return ok({
        lat,
        lon,
        label,
        temperatureC: null,
        rainMmNext24h: 0,
        weatherCode: null,
        source: "local-offline",
      });
    }
  }

  if (p === "/api/locations" && method === "GET") return ok({ locations: db.locations });
  if (p === "/api/locations" && method === "POST") {
    const loc = {
      id: uid(),
      name: String(body?.name || "Ort"),
      kind: String(body?.kind || "room"),
      notes: String(body?.notes || ""),
      sortOrder: Number(body?.sortOrder || 0),
    };
    db.locations.push(loc);
    await saveDb(db);
    return ok(loc);
  }

  if (p === "/api/plants" && method === "GET") {
    const kind = url.searchParams.get("kind");
    let plants = db.plants.filter((x) => !x.archived);
    if (kind) plants = plants.filter((x) => x.kind === kind);
    return ok({ plants });
  }
  if (p === "/api/plants" && method === "POST") {
    const now = new Date().toISOString();
    const plant = {
      id: uid(),
      kind: body?.kind || "indoor",
      name: body?.name || "Pflanze",
      species: body?.species || "",
      locationId: body?.locationId ?? null,
      tags: body?.tags || [],
      notes: body?.notes || "",
      photoPath: null,
      photoUrl: null,
      acquiredAt: null,
      createdAt: now,
      updatedAt: now,
      scientificName: body?.scientificName || "",
      commonName: body?.commonName || "",
      wateringProfile: body?.wateringProfile || "",
      lightNeeds: body?.lightNeeds || "",
      humidity: body?.humidity || "",
      soilMix: body?.soilMix || "",
      healthStatus: body?.healthStatus || "ok",
      origin: body?.origin || "",
      price: body?.price ?? null,
      archived: false,
    };
    db.plants.push(plant);
    await saveDb(db);
    return ok({ plant });
  }

  const plantMatch = /^\/api\/plants\/([^/]+)$/.exec(p);
  if (plantMatch && method === "GET") {
    const plant = db.plants.find((x) => x.id === plantMatch[1]);
    if (!plant) return err(404, "Not found");
    return ok({ plant });
  }
  if (plantMatch && method === "PATCH") {
    const i = db.plants.findIndex((x) => x.id === plantMatch[1]);
    if (i < 0) return err(404, "Not found");
    db.plants[i] = { ...db.plants[i], ...body, updatedAt: new Date().toISOString() };
    await saveDb(db);
    return ok({ plant: db.plants[i] });
  }
  if (plantMatch && method === "DELETE") {
    db.plants = db.plants.filter((x) => x.id !== plantMatch[1]);
    await saveDb(db);
    return noContent();
  }

  if (p.endsWith("/events") && method === "GET") {
    const id = p.split("/")[3];
    return ok({ events: db.events.filter((e) => e.plantId === id) });
  }
  if (p === "/api/events" && method === "POST") {
    const event = {
      id: uid(),
      plantId: body?.plantId,
      eventType: body?.eventType,
      note: body?.note || "",
      photoPath: null,
      performedAt: body?.performedAt || new Date().toISOString(),
      performedBy: u.id,
    };
    db.events.unshift(event);
    await saveDb(db);
    return ok({ event });
  }

  if (p === "/api/reminders/status") {
    let rain = 0;
    try {
      const w = await handleLocal("/api/weather");
      rain = Number((w.body as { rainMmNext24h?: number })?.rainMmNext24h || 0);
    } catch {
      /* ignore */
    }
    const statuses = db.reminders
      .filter((r) => r.active !== false)
      .map((r) =>
        computeReminderStatus(
          {
            id: String(r.id),
            plantId: String(r.plantId),
            eventType: r.eventType as never,
            intervalDays: Number(r.intervalDays || 4),
            rainAware: Boolean(r.rainAware),
            active: true,
          },
          db.events.map((e) => ({
            id: String(e.id),
            plantId: String(e.plantId),
            eventType: e.eventType as never,
            note: String(e.note || ""),
            photoPath: null,
            performedAt: String(e.performedAt),
            performedBy: String(e.performedBy || ""),
          })),
          new Date(),
          rain,
        ),
      );
    return ok({ rainMmNext24h: rain, statuses });
  }
  if (p === "/api/reminders" && method === "GET") return ok({ reminders: db.reminders });
  if (p === "/api/reminders" && method === "POST") {
    const reminder = {
      id: uid(),
      plantId: body?.plantId,
      eventType: body?.eventType,
      intervalDays: body?.intervalDays || 4,
      rainAware: Boolean(body?.rainAware),
      active: true,
    };
    db.reminders.push(reminder);
    await saveDb(db);
    return ok({ reminder });
  }

  if (p === "/api/bonsai" && method === "GET") {
    const plants = db.plants.filter((x) => x.kind === "bonsai" && !x.archived);
    return ok({
      items: plants.map((plant) => ({
        plant,
        profile: db.bonsai.find((b) => b.plantId === plant.id) || null,
        wireOverdue: false,
      })),
    });
  }
  const bonsaiPut = /^\/api\/bonsai\/([^/]+)$/.exec(p);
  if (bonsaiPut && method === "PUT") {
    const plantId = bonsaiPut[1];
    const profile = { plantId, ...body };
    const i = db.bonsai.findIndex((b) => b.plantId === plantId);
    if (i >= 0) db.bonsai[i] = profile;
    else db.bonsai.push(profile);
    await saveDb(db);
    return ok({ profile, seasonal: [], suggestRepotYears: 2, wireOverdue: false });
  }

  if (p === "/api/beds" && method === "GET") return ok({ beds: db.beds });
  if (p === "/api/beds" && method === "POST") {
    const bed = {
      id: uid(),
      name: body?.name,
      widthCells: body?.widthCells || 8,
      heightCells: body?.heightCells || 4,
      year: body?.year || new Date().getFullYear(),
      notes: body?.notes || "",
    };
    db.beds.push(bed);
    await saveDb(db);
    return ok({ bed });
  }
  if (p === "/api/seeds" && method === "GET") return ok({ seeds: db.seeds });
  if (p === "/api/seeds" && method === "POST") {
    const seed = {
      id: uid(),
      name: body?.name || body?.nameDe || "Saat",
      species: body?.species || body?.nameLatin || "",
      family: body?.family || "",
      quantity: body?.quantity ?? 1,
      unit: body?.unit || "pkt",
      yearHarvested: body?.yearHarvested ?? null,
      notes: body?.notes || "",
      nameDe: body?.nameDe || body?.name || "",
      nameEn: body?.nameEn || "",
      nameLatin: body?.nameLatin || body?.species || "",
      license: body?.license || "unknown",
      purchasedAt: body?.purchasedAt ?? null,
      propagatedAt: body?.propagatedAt ?? null,
      generation: body?.generation ?? 0,
      parentSeedId: body?.parentSeedId ?? null,
      cultivarId: body?.cultivarId ?? null,
    };
    db.seeds.push(seed);
    await saveDb(db);
    return ok({ seed });
  }
  const seedPropEarly = /^\/api\/seeds\/([^/]+)\/propagate$/.exec(p);
  if (seedPropEarly && method === "POST") {
    const cur = db.seeds.find((s) => s.id === seedPropEarly[1]) as Record<string, unknown> | undefined;
    if (!cur) return err(404, "Not found");
    const gen = Number(cur.generation || 0) + 1;
    const seed = {
      ...cur,
      id: uid(),
      name: `${cur.name} G${gen}`,
      generation: gen,
      parentSeedId: cur.id,
      purchasedAt: null,
      propagatedAt: new Date().toISOString().slice(0, 10),
      quantity: 1,
      yearHarvested: new Date().getFullYear(),
      notes: `Vermehrt aus ${cur.id}`,
    };
    db.seeds.push(seed);
    await saveDb(db);
    return ok({ seed });
  }
  if (p === "/api/plantings" && method === "GET") {
    const bedId = url.searchParams.get("bedId");
    const year = url.searchParams.get("year");
    let list = db.plantings;
    if (bedId) list = list.filter((x) => x.bedId === bedId);
    if (year) list = list.filter((x) => x.year === Number(year));
    return ok({ plantings: list });
  }
  if (p === "/api/plantings" && method === "POST") {
    const planting = { id: uid(), harvestedAt: null, ...body };
    db.plantings.push(planting);
    await saveDb(db);
    return ok({ planting });
  }
  if (p === "/api/garden/analysis") {
    const year = Number(url.searchParams.get("year") || new Date().getFullYear());
    const bedId = url.searchParams.get("bedId");
    const current = db.plantings.filter(
      (x) => Number(x.year) === year && (!bedId || x.bedId === bedId),
    ) as never[];
    const history = db.plantings.filter(
      (x) => Number(x.year) < year && (!bedId || x.bedId === bedId),
    ) as never[];
    return ok({
      year,
      score: layoutScore(current),
      rotation: rotationWarnings(current, history),
      companions: companionWarnings(current),
    });
  }
  if (p === "/api/garden/optimize" && method === "POST") {
    const bed = db.beds.find((b) => b.id === body?.bedId);
    if (!bed) return err(404, "Bed not found");
    const year = Number(bed.year);
    const history = db.plantings.filter(
      (x) => x.bedId === body?.bedId && Number(x.year) < year,
    ) as never[];
    const current = db.plantings.filter(
      (x) => x.bedId === body?.bedId && Number(x.year) === year,
    ) as never[];
    const crops = (body?.crops as { name: string; family: string; w?: number; h?: number }[]) || [];
    const mode = (body?.mode as "fresh" | "fit") || "fresh";
    const result = optimizeLayout(
      {
        bedId: String(body?.bedId),
        year,
        widthCells: Number(bed.widthCells),
        heightCells: Number(bed.heightCells),
        crops: crops.map((c) => ({ name: c.name, family: c.family, w: c.w || 1, h: c.h || 1 })),
        locked: mode === "fit" ? current : [],
        history,
        mode,
      },
      Number(body?.seed) || 42,
    );
    return ok(result);
  }
  if (p === "/api/cultivars") {
    return ok({ cultivars: searchCultivars(url.searchParams.get("q") || "", 80) });
  }
  if (p === "/api/garden/rotation-suggest") {
    const bedId = url.searchParams.get("bedId");
    const year = Number(url.searchParams.get("year") || new Date().getFullYear());
    const bed = db.beds.find((b) => b.id === bedId);
    if (!bed) return err(404, "Bed not found");
    const suggestions = suggestRotation({
      bedId: String(bedId),
      year,
      widthCells: Number(bed.widthCells),
      heightCells: Number(bed.heightCells),
      history: db.plantings.filter((x) => x.bedId === bedId && Number(x.year) < year) as never[],
      seeds: db.seeds as never[],
      step: 2,
    });
    return ok({ year, bedId, suggestions });
  }
  if (p === "/api/tasks" && method === "GET") return ok({ tasks: db.tasks });
  if (p === "/api/tasks" && method === "POST") {
    const task = {
      id: uid(),
      title: body?.title,
      dueAt: body?.dueAt ?? null,
      plantId: null,
      bedId: null,
      done: false,
      assigneeId: null,
      createdAt: new Date().toISOString(),
    };
    db.tasks.push(task);
    await saveDb(db);
    return ok(task);
  }
  const taskPatch = /^\/api\/tasks\/([^/]+)$/.exec(p);
  if (taskPatch && method === "PATCH") {
    const i = db.tasks.findIndex((t) => t.id === taskPatch[1]);
    if (i < 0) return err(404, "Not found");
    db.tasks[i] = { ...db.tasks[i], ...body };
    await saveDb(db);
    return ok({ ok: true });
  }

  if (p === "/api/inventory" && method === "GET") return ok({ items: db.inventory });
  if (p === "/api/inventory" && method === "POST") {
    const item = { id: uid(), ...body };
    db.inventory.push(item);
    await saveDb(db);
    return ok({ id: item.id, ...body });
  }

  if (p === "/api/chat" && method === "GET") return ok({ messages: db.chat });
  if (p === "/api/chat" && method === "POST") {
    const message = {
      id: uid(),
      userId: u.id,
      displayName: u.displayName,
      body: body?.body,
      createdAt: new Date().toISOString(),
    };
    db.chat.push(message);
    await saveDb(db);
    return ok({ message });
  }

  if (p === "/api/calendar" && method === "GET") return ok({ events: db.calendar });
  if (p === "/api/calendar" && method === "POST") {
    const ev = { id: uid(), ...body };
    db.calendar.push(ev);
    await saveDb(db);
    return ok(ev);
  }

  if (p === "/api/harvest" && method === "GET") return ok({ harvests: db.harvests });
  if (p === "/api/harvest" && method === "POST") {
    const h = { id: uid(), harvestedAt: new Date().toISOString(), ...body };
    db.harvests.unshift(h);
    await saveDb(db);
    return ok(h);
  }

  if (p === "/api/guides") {
    return ok({
      guides: [
        { id: "local-mode", pillar: "general", title: "Local-Modus", summary: "Daten nur auf dem Gerät." },
      ],
    });
  }
  if (p.startsWith("/api/guides/")) {
    return ok({
      guide: {
        id: "local-mode",
        pillar: "general",
        title: "Local-Modus",
        summary: "Offline",
        body: "Im Local-Modus bleiben alle Daten in IndexedDB auf dem Gerät. Für Sync Server verbinden.",
      },
    });
  }

  if (p === "/api/search") {
    const q = (url.searchParams.get("q") || "").toLowerCase();
    return ok({
      plants: db.plants.filter((x) => String(x.name).toLowerCase().includes(q)),
      tasks: db.tasks.filter((x) => String(x.title).toLowerCase().includes(q)),
      seeds: db.seeds.filter((x) => String(x.name).toLowerCase().includes(q)),
      inventory: db.inventory.filter((x) => String(x.name).toLowerCase().includes(q)),
    });
  }

  if (p === "/api/history") return ok({ history: [] });
  if (p === "/api/grow/gdd/batch") return ok({ items: [] });
  if (p === "/api/grow/mix" && method === "POST") {
    return ok({
      mix: {
        ok: true,
        warnings: [],
        estimatedEc: 1.2,
        addWaterL: 0,
        mixOrder: ["local"],
        notes: ["Offline-Schätzung"],
      },
    });
  }

  const photosGet = /^\/api\/plants\/([^/]+)\/photos$/.exec(p);
  if (photosGet && method === "GET") {
    return ok({ photos: db.photos.filter((x) => x.plantId === photosGet[1]) });
  }

  if (p === "/api/backup") {
    const snap = await buildLocalSnapshot();
    return ok({ ...snap, note: "Local backup JSON — use Sync export for file download" });
  }

  if (p === "/api/sync/export") {
    return ok(await buildLocalSnapshot());
  }
  if (p === "/api/sync/import" && method === "POST") {
    await applySnapshotToLocal(body as unknown as HortisSyncV1);
    return ok({ ok: true, upserted: 0, importedAt: new Date().toISOString() });
  }

  if (p === "/api/species/gbif") {
    const q = (url.searchParams.get("q") || "").trim();
    if (q.length < 2) return err(400, "q min 2 chars");
    try {
      const res = await fetch(
        `https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(q)}&limit=12`,
      );
      if (!res.ok) return err(502, `GBIF ${res.status}`);
      const data = (await res.json()) as Array<{
        key?: number;
        scientificName?: string;
        canonicalName?: string;
        vernacularName?: string;
        rank?: string;
        kingdom?: string;
      }>;
      return ok({
        results: (Array.isArray(data) ? data : []).map((r) => ({
          key: r.key,
          scientificName: r.scientificName || r.canonicalName || "",
          vernacularName: r.vernacularName || "",
          rank: r.rank || "",
          kingdom: r.kingdom || "",
        })),
      });
    } catch {
      return err(502, "GBIF unreachable");
    }
  }

  if (p === "/api/identify" && method === "POST") {
    const key = String(db.settings.plantNetApiKey || "");
    if (!key) return err(400, "PlantNet API-Key fehlt (Einstellungen)");
    return err(501, "Local identify: bitte Bild über Kollaboration mit Server oder Key + FormData nutzen");
  }

  const photosPost = /^\/api\/plants\/([^/]+)\/photos$/.exec(p);
  if (photosPost && method === "POST") {
    // Local: body may contain dataUrl from client helper
    const dataUrl = String(body?.dataUrl || "");
    if (!dataUrl.startsWith("data:")) return err(400, "dataUrl required in local mode");
    const photo = {
      id: uid(),
      plantId: photosPost[1],
      path: dataUrl,
      url: dataUrl,
      createdAt: new Date().toISOString(),
    };
    db.photos.push(photo);
    const plant = db.plants.find((x) => x.id === photosPost[1]);
    if (plant) {
      plant.photoUrl = dataUrl;
      plant.photoPath = dataUrl;
    }
    await saveDb(db);
    return ok({ photo });
  }

  return err(404, `Local handler missing: ${method} ${p}`);
}
