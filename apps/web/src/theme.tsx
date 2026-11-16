import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken } from "./api";

export type ThemeId = "linen" | "moss" | "birch" | "slate" | "dusk" | "ink";
export type DensityId = "compact" | "cozy" | "airy";

const THEMES: { id: ThemeId; label: string; hint: string }[] = [
  { id: "linen", label: "Leinen", hint: "Hell, ruhig" },
  { id: "moss", label: "Moos", hint: "Dunkelgrün" },
  { id: "birch", label: "Birke", hint: "Warm hell" },
  { id: "slate", label: "Schiefer", hint: "Kühles Grau" },
  { id: "dusk", label: "Dämmerung", hint: "Warm dunkel" },
  { id: "ink", label: "Tusche", hint: "Kontrastreich" },
];

const DENSITIES: { id: DensityId; label: string }[] = [
  { id: "compact", label: "Kompakt" },
  { id: "cozy", label: "Normal" },
  { id: "airy", label: "Luftig" },
];

const LEGACY: Record<string, ThemeId> = {
  forest: "moss",
  clay: "birch",
  midnight: "ink",
  orchid: "dusk",
  paper: "linen",
};

type ThemeCtx = {
  theme: ThemeId;
  themes: typeof THEMES;
  density: DensityId;
  densities: typeof DENSITIES;
  setTheme: (id: ThemeId) => Promise<void>;
  setDensity: (id: DensityId) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

function normalizeTheme(raw: string | null | undefined): ThemeId {
  if (!raw) return "linen";
  if ((THEMES as { id: string }[]).some((t) => t.id === raw)) return raw as ThemeId;
  return LEGACY[raw] || "linen";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() =>
    normalizeTheme(localStorage.getItem("hortis_theme")),
  );
  const [density, setDensityState] = useState<DensityId>(() => {
    const d = localStorage.getItem("hortis_density");
    return d === "compact" || d === "airy" || d === "cozy" ? d : "cozy";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hortis_theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
    localStorage.setItem("hortis_density", density);
  }, [density]);

  useEffect(() => {
    if (!getToken()) return;
    void api<{ settings: { theme?: string } }>("/api/settings")
      .then((r) => {
        if (r.settings.theme) setThemeState(normalizeTheme(r.settings.theme));
      })
      .catch(() => undefined);
  }, []);

  const setTheme = useCallback(async (id: ThemeId) => {
    setThemeState(id);
    if (!getToken()) return;
    await api("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ theme: id }),
    }).catch(() => undefined);
  }, []);

  const setDensity = useCallback((id: DensityId) => {
    setDensityState(id);
  }, []);

  const value = useMemo(
    () => ({ theme, themes: THEMES, density, densities: DENSITIES, setTheme, setDensity }),
    [theme, density, setTheme, setDensity],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("ThemeProvider missing");
  return ctx;
}
