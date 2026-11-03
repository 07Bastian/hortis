import { FormEvent, useState } from "react";
import { getMode } from "../api";
import { useAuth } from "../auth";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@hortis.local");
  const [password, setPassword] = useState("hortis-admin-change-me");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const mode = getMode();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="panel login-panel stack" onSubmit={onSubmit}>
        <div>
          <div className="brand">Hortis</div>
          <p className="muted">Self-hosted Pflege für Zimmer, Bonsai und Beete.</p>
          <p className="badge">{mode === "local" ? "Local-Modus (ohne Server)" : "Server-Modus"}</p>
        </div>
        <label className="field">
          E-Mail
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label className="field">
          Passwort
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={8}
          />
        </label>
        {error ? <div className="badge danger">{error}</div> : null}
        <button className="btn" disabled={busy}>
          {busy ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}
