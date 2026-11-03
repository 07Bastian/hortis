import { handleLocal } from "./local/handler";

const TOKEN_KEY = "hortis_token";
const MODE_KEY = "hortis_mode";
const API_BASE_KEY = "hortis_api_base";

export type AppMode = "local" | "server";

export function getMode(): AppMode {
  const m = localStorage.getItem(MODE_KEY);
  if (m === "server" || m === "local") return m;
  // Capacitor / file / offline → default local
  const isNative =
    typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
      ?.isNativePlatform === "function" &&
    (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform();
  return isNative ? "local" : "server";
}

export function setMode(mode: AppMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

export function getApiBase(): string {
  return localStorage.getItem(API_BASE_KEY) || "";
}

export function setApiBase(base: string): void {
  localStorage.setItem(API_BASE_KEY, base.replace(/\/$/, ""));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (getMode() === "local") {
    const res = await handleLocal(path, options);
    if (res.status === 204) return undefined as T;
    if (res.status >= 400) {
      const body = res.body as { error?: string };
      throw new Error(body?.error || `HTTP ${res.status}`);
    }
    return res.body as T;
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error?.toString?.() ||
        (data as { error?: string }).error ||
        res.statusText,
    );
  }
  return data as T;
}
