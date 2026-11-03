import type { DatabaseSync } from "node:sqlite";

export function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','member')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS plants (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK(kind IN ('indoor','bonsai','garden')),
      name TEXT NOT NULL,
      species TEXT NOT NULL DEFAULT '',
      location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      photo_path TEXT,
      acquired_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      scientific_name TEXT NOT NULL DEFAULT '',
      common_name TEXT NOT NULL DEFAULT '',
      watering_profile TEXT NOT NULL DEFAULT '',
      light_needs TEXT NOT NULL DEFAULT '',
      humidity TEXT NOT NULL DEFAULT '',
      soil_mix TEXT NOT NULL DEFAULT '',
      health_status TEXT NOT NULL DEFAULT 'ok',
      origin TEXT NOT NULL DEFAULT '',
      price REAL,
      qr_code TEXT
    );

    CREATE TABLE IF NOT EXISTS care_events (
      id TEXT PRIMARY KEY,
      plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      photo_path TEXT,
      performed_at TEXT NOT NULL,
      performed_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS care_reminders (
      id TEXT PRIMARY KEY,
      plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      interval_days INTEGER NOT NULL,
      rain_aware INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS bonsai_profiles (
      plant_id TEXT PRIMARY KEY REFERENCES plants(id) ON DELETE CASCADE,
      style TEXT NOT NULL,
      phase TEXT NOT NULL,
      pot_type TEXT NOT NULL DEFAULT '',
      height_cm REAL,
      wired_until TEXT,
      last_repot_at TEXT,
      winter_protection INTEGER NOT NULL DEFAULT 0,
      training_notes TEXT NOT NULL DEFAULT '',
      age_years REAL,
      trunk_diameter_cm REAL,
      nebari_notes TEXT NOT NULL DEFAULT '',
      species_group TEXT NOT NULL DEFAULT '',
      outdoor INTEGER NOT NULL DEFAULT 1,
      next_wiring_at TEXT,
      display_ready INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS beds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      width_cells INTEGER NOT NULL,
      height_cells INTEGER NOT NULL,
      year INTEGER NOT NULL,
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS seeds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT NOT NULL DEFAULT '',
      family TEXT NOT NULL DEFAULT '',
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'pkt',
      year_harvested INTEGER,
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS plantings (
      id TEXT PRIMARY KEY,
      bed_id TEXT NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
      seed_id TEXT REFERENCES seeds(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      family TEXT NOT NULL DEFAULT '',
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      w INTEGER NOT NULL DEFAULT 1,
      h INTEGER NOT NULL DEFAULT 1,
      year INTEGER NOT NULL,
      planted_at TEXT,
      harvested_at TEXT,
      phase TEXT NOT NULL DEFAULT 'planned'
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'stk',
      shopping INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      due_at TEXT,
      plant_id TEXT REFERENCES plants(id) ON DELETE SET NULL,
      bed_id TEXT REFERENCES beds(id) ON DELETE SET NULL,
      done INTEGER NOT NULL DEFAULT 0,
      assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plant_photos (
      id TEXT PRIMARY KEY,
      plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      caption TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_log (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      display_name TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      class TEXT NOT NULL DEFAULT 'general',
      date_from TEXT NOT NULL,
      date_till TEXT NOT NULL,
      plant_id TEXT REFERENCES plants(id) ON DELETE SET NULL,
      bed_id TEXT REFERENCES beds(id) ON DELETE SET NULL,
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS harvest_logs (
      id TEXT PRIMARY KEY,
      planting_id TEXT REFERENCES plantings(id) ON DELETE SET NULL,
      bed_id TEXT REFERENCES beds(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      weight_g REAL,
      quality TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      harvested_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      last_used_at TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS plant_history (
      id TEXT PRIMARY KEY,
      plant_json TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT 'archived',
      archived_at TEXT NOT NULL,
      archived_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_plants_kind ON plants(kind);
    CREATE INDEX IF NOT EXISTS idx_events_plant ON care_events(plant_id);
    CREATE INDEX IF NOT EXISTS idx_plantings_bed ON plantings(bed_id);
    CREATE INDEX IF NOT EXISTS idx_photos_plant ON plant_photos(plant_id);
    CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_cal_from ON calendar_events(date_from);
  `);

  const plantCols = db.prepare(`PRAGMA table_info(plants)`).all() as { name: string }[];
  const plantNames = new Set(plantCols.map((c) => c.name));
  const plantExtras: [string, string][] = [
    ["scientific_name", "TEXT NOT NULL DEFAULT ''"],
    ["common_name", "TEXT NOT NULL DEFAULT ''"],
    ["watering_profile", "TEXT NOT NULL DEFAULT ''"],
    ["light_needs", "TEXT NOT NULL DEFAULT ''"],
    ["humidity", "TEXT NOT NULL DEFAULT ''"],
    ["soil_mix", "TEXT NOT NULL DEFAULT ''"],
    ["health_status", "TEXT NOT NULL DEFAULT 'ok'"],
    ["origin", "TEXT NOT NULL DEFAULT ''"],
    ["price", "REAL"],
    ["qr_code", "TEXT"],
    ["archived", "INTEGER NOT NULL DEFAULT 0"],
  ];
  for (const [col, def] of plantExtras) {
    if (!plantNames.has(col)) db.exec(`ALTER TABLE plants ADD COLUMN ${col} ${def}`);
  }

  const bonsaiCols = db.prepare(`PRAGMA table_info(bonsai_profiles)`).all() as { name: string }[];
  const bonsaiNames = new Set(bonsaiCols.map((c) => c.name));
  const bonsaiExtras: [string, string][] = [
    ["age_years", "REAL"],
    ["trunk_diameter_cm", "REAL"],
    ["nebari_notes", "TEXT NOT NULL DEFAULT ''"],
    ["species_group", "TEXT NOT NULL DEFAULT ''"],
    ["outdoor", "INTEGER NOT NULL DEFAULT 1"],
    ["next_wiring_at", "TEXT"],
    ["display_ready", "INTEGER NOT NULL DEFAULT 0"],
  ];
  for (const [col, def] of bonsaiExtras) {
    if (!bonsaiNames.has(col)) db.exec(`ALTER TABLE bonsai_profiles ADD COLUMN ${col} ${def}`);
  }
}
