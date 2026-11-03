import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { de, type Dict } from "./de";
import { en } from "./en";

export type Lang = "de" | "en";

const KEY = "hortis_lang";

type Ctx = {
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const v = localStorage.getItem(KEY);
    return v === "en" || v === "de" ? v : "de";
  });

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(KEY, l);
    setLangState(l);
    document.documentElement.lang = l;
  }, []);

  const value = useMemo(
    () => ({ lang, t: lang === "en" ? en : de, setLang }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}
