export type PlantKind = "indoor" | "bonsai" | "garden";
export type UserRole = "admin" | "member";

export type CareEventType =
  | "water"
  | "fertilize"
  | "mist"
  | "prune"
  | "repot"
  | "wire"
  | "unwire"
  | "harvest"
  | "pest"
  | "note"
  | "photo";

export type BonsaiStyle =
  | "chokkan"
  | "moyogi"
  | "shakan"
  | "kengai"
  | "han_kengai"
  | "bunjingi"
  | "sokan"
  | "yose_ue"
  | "other";

export type BonsaiPhase =
  | "nursery"
  | "training"
  | "refinement"
  | "display"
  | "recovery";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  kind: "room" | "shelf" | "outdoor" | "greenhouse" | "other";
  notes: string;
  sortOrder: number;
}

export interface Plant {
  id: string;
  kind: PlantKind;
  name: string;
  species: string;
  locationId: string | null;
  tags: string[];
  notes: string;
  photoPath: string | null;
  acquiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareReminder {
  id: string;
  plantId: string;
  eventType: CareEventType;
  intervalDays: number;
  rainAware: boolean;
  active: boolean;
}

export interface CareEvent {
  id: string;
  plantId: string;
  eventType: CareEventType;
  note: string;
  photoPath: string | null;
  performedAt: string;
  performedBy: string | null;
}

export interface BonsaiProfile {
  plantId: string;
  style: BonsaiStyle;
  phase: BonsaiPhase;
  potType: string;
  heightCm: number | null;
  wiredUntil: string | null;
  lastRepotAt: string | null;
  winterProtection: boolean;
  trainingNotes: string;
}

export interface Bed {
  id: string;
  name: string;
  widthCells: number;
  heightCells: number;
  year: number;
  notes: string;
}

export interface SeedItem {
  id: string;
  name: string;
  species: string;
  family: string;
  quantity: number;
  unit: string;
  yearHarvested: number | null;
  notes: string;
  nameDe: string;
  nameEn: string;
  nameLatin: string;
  license: string;
  purchasedAt: string | null;
  propagatedAt: string | null;
  generation: number;
  parentSeedId: string | null;
  cultivarId: string | null;
}

export interface Planting {
  id: string;
  bedId: string;
  seedId: string | null;
  name: string;
  family: string;
  x: number;
  y: number;
  w: number;
  h: number;
  year: number;
  plantedAt: string | null;
  harvestedAt: string | null;
  phase: "planned" | "seeded" | "growing" | "harvest" | "done";
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  shopping: boolean;
  notes: string;
}

export interface TaskItem {
  id: string;
  title: string;
  dueAt: string | null;
  plantId: string | null;
  bedId: string | null;
  done: boolean;
  assigneeId: string | null;
  createdAt: string;
}
