import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { IndoorPage } from "./pages/IndoorPage";
import { BonsaiPage } from "./pages/BonsaiPage";
import { GardenPage } from "./pages/GardenPage";
import { OpsPage } from "./pages/OpsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { GuidesPage } from "./pages/GuidesPage";

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Hortis</div>
        <div className="brand-sub">Sammlung · Pflege · Beet</div>
        <nav className="nav">
          <NavLink to="/" end>Übersicht</NavLink>
          <NavLink to="/indoor">Zimmer</NavLink>
          <NavLink to="/bonsai">Bonsai</NavLink>
          <NavLink to="/garden">Garten</NavLink>
          <NavLink to="/guides">Guides</NavLink>
          <NavLink to="/ops">Aufgaben</NavLink>
          <NavLink to="/settings">Einstellungen</NavLink>
        </nav>
        <div className="auth-meta">
          <div>{user?.displayName}</div>
          <div className="muted">{user?.email}</div>
          <button className="btn secondary" style={{ marginTop: 8 }} onClick={logout}>
            Abmelden
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="login-wrap muted">Lade Hortis…</div>;
  if (!user) return <LoginPage />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/indoor" element={<IndoorPage />} />
        <Route path="/bonsai" element={<BonsaiPage />} />
        <Route path="/garden" element={<GardenPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/ops" element={<OpsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
