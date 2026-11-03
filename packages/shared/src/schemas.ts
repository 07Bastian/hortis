import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

export const registerSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(120),
});

export const locationSchema = z.object({
  name: z.string().min(1).max(120),
  kind: z.enum(["room", "shelf", "outdoor", "greenhouse", "other"]),
  notes: z.string().max(2000).default(""),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

export const plantSchema = z.object({
  kind: z.enum(["indoor", "bonsai", "garden"]),
  name: z.string().min(1).max(160),
  species: z.string().max(200).default(""),
  locationId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  notes: z.string().max(5000).default(""),
  acquiredAt: z.string().datetime().nullable().optional(),
  scientificName: z.string().max(200).default(""),
  commonName: z.string().max(200).default(""),
  wateringProfile: z.string().max(80).default(""),
  lightNeeds: z.string().max(80).default(""),
  humidity: z.string().max(80).default(""),
  soilMix: z.string().max(200).default(""),
  healthStatus: z.enum(["ok", "watch", "sick", "dormant"]).default("ok"),
  origin: z.string().max(200).default(""),
  price: z.number().min(0).nullable().optional(),
});

export const careEventSchema = z.object({
  plantId: z.string().uuid(),
  eventType: z.enum([
    "water",
    "fertilize",
    "mist",
    "prune",
    "repot",
    "wire",
    "unwire",
    "harvest",
    "pest",
    "note",
    "photo",
  ]),
  note: z.string().max(2000).default(""),
  performedAt: z.string().datetime().optional(),
});

export const reminderSchema = z.object({
  plantId: z.string().uuid(),
  eventType: z.enum([
    "water",
    "fertilize",
    "mist",
    "prune",
    "repot",
    "wire",
    "unwire",
    "harvest",
    "pest",
    "note",
    "photo",
  ]),
  intervalDays: z.number().int().min(1).max(365),
  rainAware: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const bonsaiProfileSchema = z.object({
  style: z.enum([
    "chokkan",
    "moyogi",
    "shakan",
    "kengai",
    "han_kengai",
    "bunjingi",
    "sokan",
    "yose_ue",
    "other",
  ]),
  phase: z.enum(["nursery", "training", "refinement", "display", "recovery"]),
  potType: z.string().max(80).default(""),
  heightCm: z.number().positive().nullable().optional(),
  wiredUntil: z.string().datetime().nullable().optional(),
  lastRepotAt: z.string().datetime().nullable().optional(),
  winterProtection: z.boolean().default(false),
  trainingNotes: z.string().max(5000).default(""),
  ageYears: z.number().min(0).nullable().optional(),
  trunkDiameterCm: z.number().min(0).nullable().optional(),
  nebariNotes: z.string().max(2000).default(""),
  speciesGroup: z.string().max(80).default(""),
  outdoor: z.boolean().default(true),
  nextWiringAt: z.string().datetime().nullable().optional(),
  displayReady: z.boolean().default(false),
});

export const bedSchema = z.object({
  name: z.string().min(1).max(120),
  widthCells: z.number().int().min(1).max(40).default(8),
  heightCells: z.number().int().min(1).max(40).default(4),
  year: z.number().int().min(2000).max(2100),
  notes: z.string().max(2000).default(""),
});

export const seedSchema = z.object({
  name: z.string().min(1).max(160),
  species: z.string().max(200).default(""),
  family: z.string().max(120).default(""),
  quantity: z.number().min(0).default(0),
  unit: z.string().max(40).default("pkt"),
  yearHarvested: z.number().int().nullable().optional(),
  notes: z.string().max(2000).default(""),
});

export const plantingSchema = z.object({
  bedId: z.string().uuid(),
  seedId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(160),
  family: z.string().max(120).default(""),
  x: z.number().int().min(0).max(39),
  y: z.number().int().min(0).max(39),
  w: z.number().int().min(1).max(40).default(1),
  h: z.number().int().min(1).max(40).default(1),
  year: z.number().int().min(2000).max(2100),
  plantedAt: z.string().datetime().nullable().optional(),
  phase: z
    .enum(["planned", "seeded", "growing", "harvest", "done"])
    .default("planned"),
});

export const inventorySchema = z.object({
  name: z.string().min(1).max(160),
  category: z.string().max(80).default("general"),
  quantity: z.number().min(0).default(0),
  unit: z.string().max(40).default("stk"),
  shopping: z.boolean().default(false),
  notes: z.string().max(2000).default(""),
});

export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  dueAt: z.string().datetime().nullable().optional(),
  plantId: z.string().uuid().nullable().optional(),
  bedId: z.string().uuid().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  done: z.boolean().default(false),
});
