import type {
  Bed,
  BonsaiProfile,
  CareEvent,
  CareReminder,
  Plant,
  Planting,
  SeedItem,
} from "@hortis/shared";

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v == null ? fallback : String(v);
}

function strNull(v: unknown): string | null {
  return v == null ? null : String(v);
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : Number(v) || fallback;
}

function numNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapPlant(row: Record<string, unknown>): Plant & Record<string, unknown> {
  return {
    id: str(row.id),
    kind: str(row.kind) as Plant["kind"],
    name: str(row.name),
    species: str(row.species),
    locationId: strNull(row.location_id),
    tags: JSON.parse(str(row.tags_json, "[]")) as string[],
    notes: str(row.notes),
    photoPath: strNull(row.photo_path),
    photoUrl: row.photo_path ? `/uploads/${row.photo_path}` : null,
    acquiredAt: strNull(row.acquired_at),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    scientificName: str(row.scientific_name),
    commonName: str(row.common_name),
    wateringProfile: str(row.watering_profile),
    lightNeeds: str(row.light_needs),
    humidity: str(row.humidity),
    soilMix: str(row.soil_mix),
    healthStatus: str(row.health_status, "ok"),
    origin: str(row.origin),
    price: numNull(row.price),
  };
}

export function mapEvent(row: Record<string, unknown>): CareEvent {
  return {
    id: str(row.id),
    plantId: str(row.plant_id),
    eventType: str(row.event_type) as CareEvent["eventType"],
    note: str(row.note),
    photoPath: strNull(row.photo_path),
    performedAt: str(row.performed_at),
    performedBy: strNull(row.performed_by),
  };
}

export function mapReminder(row: Record<string, unknown>): CareReminder {
  return {
    id: str(row.id),
    plantId: str(row.plant_id),
    eventType: str(row.event_type) as CareReminder["eventType"],
    intervalDays: num(row.interval_days),
    rainAware: Boolean(row.rain_aware),
    active: Boolean(row.active),
  };
}

export function mapBonsai(row: Record<string, unknown>): BonsaiProfile & Record<string, unknown> {
  return {
    plantId: str(row.plant_id),
    style: str(row.style) as BonsaiProfile["style"],
    phase: str(row.phase) as BonsaiProfile["phase"],
    potType: str(row.pot_type),
    heightCm: numNull(row.height_cm),
    wiredUntil: strNull(row.wired_until),
    lastRepotAt: strNull(row.last_repot_at),
    winterProtection: Boolean(row.winter_protection),
    trainingNotes: str(row.training_notes),
    ageYears: numNull(row.age_years),
    trunkDiameterCm: numNull(row.trunk_diameter_cm),
    nebariNotes: str(row.nebari_notes),
    speciesGroup: str(row.species_group),
    outdoor: Boolean(row.outdoor ?? 1),
    nextWiringAt: strNull(row.next_wiring_at),
    displayReady: Boolean(row.display_ready),
  };
}

export function mapBed(row: Record<string, unknown>): Bed {
  return {
    id: str(row.id),
    name: str(row.name),
    widthCells: num(row.width_cells),
    heightCells: num(row.height_cells),
    year: num(row.year),
    notes: str(row.notes),
  };
}

export function mapSeed(row: Record<string, unknown>): SeedItem {
  return {
    id: str(row.id),
    name: str(row.name),
    species: str(row.species),
    family: str(row.family),
    quantity: num(row.quantity),
    unit: str(row.unit),
    yearHarvested: numNull(row.year_harvested),
    notes: str(row.notes),
    nameDe: str(row.name_de, str(row.name)),
    nameEn: str(row.name_en),
    nameLatin: str(row.name_latin, str(row.species)),
    license: str(row.license, "unknown"),
    purchasedAt: strNull(row.purchased_at),
    propagatedAt: strNull(row.propagated_at),
    generation: num(row.generation, 0),
    parentSeedId: strNull(row.parent_seed_id),
    cultivarId: strNull(row.cultivar_id),
  };
}

export function mapPlanting(row: Record<string, unknown>): Planting {
  return {
    id: str(row.id),
    bedId: str(row.bed_id),
    seedId: strNull(row.seed_id),
    name: str(row.name),
    family: str(row.family),
    x: num(row.x),
    y: num(row.y),
    w: num(row.w, 1),
    h: num(row.h, 1),
    year: num(row.year),
    plantedAt: strNull(row.planted_at),
    harvestedAt: strNull(row.harvested_at),
    phase: str(row.phase, "planned") as Planting["phase"],
  };
}

export function asSql(v: unknown): string | number | null {
  if (v == null) return null;
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  return String(v);
}
