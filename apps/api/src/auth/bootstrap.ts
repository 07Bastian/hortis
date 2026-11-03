import { config } from "../config.js";
import { db, uid } from "../db.js";
import { hashPassword } from "./password.js";

export function ensureAdminUser(): void {
  const row = db.prepare("SELECT id FROM users WHERE email = ?").get(config.adminEmail);
  if (row) return;
  db.prepare(
    `INSERT INTO users (id, email, password_hash, display_name, role, created_at)
     VALUES (?, ?, ?, ?, 'admin', ?)`,
  ).run(
    uid(),
    config.adminEmail,
    hashPassword(config.adminPassword),
    "Admin",
    new Date().toISOString(),
  );
}
