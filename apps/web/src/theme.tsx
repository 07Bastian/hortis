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

export type ThemeId = "forest" | "clay" | "midnight" | "orchid" | "paper";

const THEMES: { id: ThemeId; label: string }[] = [
  { id: "forest", label: "Forest" },
  { id: "clay", label: "Clay" },
  { id: "midnight", label: "Midnight" },
  { id: "orchid", label: "Orchid" },
  { id: "paper", label: "Paper" },
];

type ThemeCtx = {
  theme: ThemeId;
  themes: typeof THEMES;
  setTheme: (id: ThemeId) => Promise<void>;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const local = localStorage.getItem("hortis_theme") as ThemeId | null;
    return local || "forest";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hortis_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!getToken()) return;
    void api<{ settings: { theme?: string } }>("/api/settings")
      .then((r) => {
        const t = r.settings.theme as ThemeId | undefined;
        if (t && THEMES.some((x) => x.id === t)) setThemeState(t);
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

  const value = useMemo(
    () => ({ theme, themes: THEMES, setTheme }),
    [theme, setTheme],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("ThemeProvider missing");
  return ctx;
}
