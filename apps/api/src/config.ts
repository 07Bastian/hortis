import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

const root = resolve(process.cwd(), process.cwd().endsWith("api") ? "../.." : ".");
loadEnv({ path: resolve(root, ".env") });
loadEnv();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function resolveFromRoot(p: string): string {
  if (p.startsWith("/") || /^[A-Za-z]:[\\/]/.test(p)) return p;
  return resolve(root, p);
}

export const config = {
  port: Number(process.env.HORTIS_PORT ?? 8787),
  host: process.env.HORTIS_HOST ?? "0.0.0.0",
  dbPath: resolveFromRoot(process.env.HORTIS_DB_PATH ?? "./data/hortis.db"),
  uploadDir: resolveFromRoot(process.env.HORTIS_UPLOAD_DIR ?? "./uploads"),
  jwtSecret: required("HORTIS_JWT_SECRET", "dev-only-change-me-hortis-secret-32"),
  adminEmail: process.env.HORTIS_ADMIN_EMAIL ?? "admin@hortis.local",
  adminPassword: process.env.HORTIS_ADMIN_PASSWORD ?? "hortis-admin-change-me",
  corsOrigin: process.env.HORTIS_CORS_ORIGIN ?? "http://localhost:5173",
  weatherLat: Number(process.env.HORTIS_WEATHER_LAT ?? 47.6779),
  weatherLon: Number(process.env.HORTIS_WEATHER_LON ?? 11.2012),
  root,
};
