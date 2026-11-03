import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { useI18n } from "./i18n/context";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { IndoorPage } from "./pages/IndoorPage";
import { BonsaiPage } from "./pages/BonsaiPage";
import { GardenPage } from "./pages/GardenPage";
import { OpsPage } from "./pages/OpsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { GuidesPage } from "./pages/GuidesPage";
import { CollabPage } from "./pages/CollabPage";
import { GrowPage } from "./pages/GrowPage";
import { useTheme } from "./theme";

function InstallBanner() {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [hidden, setHidden] = useState(() => localStorage.getItem("hortis_hide_install") === "1");

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      const ev = e as Event & { prompt: () => Promise<void> };
      setDeferred({ prompt: () => ev.prompt() });
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (hidden || !deferred) return null;
  return (
    <div className="install-banner">
      <span>{t.install}</span>
      <button
        type="button"
        className="btn"
        onClick={() => void deferred.prompt().then(() => setDeferred(null))}
      >
        {t.install}
      </button>
      <button
        type="button"
        className="btn secondary"
        onClick={() => {
          localStorage.setItem("hortis_hide_install", "1");
          setHidden(true);
        }}
      >
        ×
      </button>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, themes, setTheme } = useTheme();
  const { t, lang, setLang } = useI18n();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Hortis</div>
        <div className="brand-sub">{t.brandSub}</div>
        <nav className="nav">
          <NavLink to="/" end>
            {t.nav.home}
          </NavLink>
          <NavLink to="/indoor">{t.nav.indoor}</NavLink>
          <NavLink to="/bonsai">{t.nav.bonsai}</NavLink>
          <NavLink to="/garden">{t.nav.garden}</NavLink>
          <NavLink to="/grow">{t.nav.grow}</NavLink>
          <NavLink to="/guides">{t.nav.guides}</NavLink>
          <NavLink to="/collab">{t.nav.collab}</NavLink>
          <NavLink to="/ops">{t.nav.ops}</NavLink>
          <NavLink to="/settings">{t.nav.settings}</NavLink>
        </nav>
        <div className="theme-switch">
          {themes.map((th) => (
            <button
              key={th.id}
              type="button"
              className={theme === th.id ? "active" : ""}
              onClick={() => void setTheme(th.id)}
            >
              {th.label}
            </button>
          ))}
        </div>
        <div className="lang-switch row">
          <span className="muted">{t.lang}</span>
          <button
            type="button"
            className={`btn secondary ${lang === "de" ? "active-lang" : ""}`}
            onClick={() => setLang("de")}
          >
            DE
          </button>
          <button
            type="button"
            className={`btn secondary ${lang === "en" ? "active-lang" : ""}`}
            onClick={() => setLang("en")}
          >
            EN
          </button>
        </div>
        <div className="auth-meta">
          <div>{user?.displayName}</div>
          <div className="muted">{user?.email}</div>
          <button className="btn secondary" style={{ marginTop: 8 }} onClick={logout}>
            {t.logout}
          </button>
        </div>
      </aside>
      <nav className="bottom-nav">
        <NavLink to="/" end>
          {t.nav.home}
        </NavLink>
        <NavLink to="/indoor">{t.nav.indoor}</NavLink>
        <NavLink to="/garden">{t.nav.garden}</NavLink>
        <NavLink to="/ops">{t.nav.ops}</NavLink>
        <NavLink to="/settings">{t.nav.settings}</NavLink>
      </nav>
      <main className="main">
        <InstallBanner />
        {children}
      </main>
    </div>
  );
}

export function App() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  if (loading) return <div className="login-wrap muted">{t.loading}</div>;
  if (!user) return <LoginPage />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/indoor" element={<IndoorPage />} />
        <Route path="/bonsai" element={<BonsaiPage />} />
        <Route path="/garden" element={<GardenPage />} />
        <Route path="/grow" element={<GrowPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/collab" element={<CollabPage />} />
        <Route path="/ops" element={<OpsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
