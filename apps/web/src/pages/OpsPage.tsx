import { FormEvent, useEffect, useState } from "react";
import { api, getMode, getToken } from "../api";
import { useAuth } from "../auth";

type Task = { id: string; title: string; done: boolean; dueAt: string | null };
type Item = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  shopping: boolean;
};

export function OpsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [itemName, setItemName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function refresh() {
    const [t, i] = await Promise.all([
      api<{ tasks: Task[] }>("/api/tasks"),
      api<{ items: Item[] }>("/api/inventory"),
    ]);
    setTasks(t.tasks);
    setItems(i.items);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function addTask(e: FormEvent) {
    e.preventDefault();
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title, done: false }),
    });
    setTitle("");
    await refresh();
  }

  async function toggleTask(task: Task) {
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ done: !task.done }),
    });
    await refresh();
  }

  async function addItem(e: FormEvent) {
    e.preventDefault();
    await api("/api/inventory", {
      method: "POST",
      body: JSON.stringify({
        name: itemName,
        category: "care",
        quantity: 1,
        unit: "stk",
        shopping: true,
        notes: "",
      }),
    });
    setItemName("");
    await refresh();
  }

  async function toggleShopping(item: Item) {
    await api(`/api/inventory/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ shopping: !item.shopping }),
    });
    await refresh();
  }

  async function registerMember(e: FormEvent) {
    e.preventDefault();
    await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: memberEmail,
        displayName: memberName,
        password: memberPassword,
      }),
    });
    setMsg(`Mitglied ${memberEmail} angelegt`);
    setMemberEmail("");
    setMemberName("");
    setMemberPassword("");
  }

  const [restoreSql, setRestoreSql] = useState("");

  async function downloadBackup() {
    const res = await fetch("/api/backup", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error("Backup fehlgeschlagen");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hortis-backup.sql";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function restoreBackup(e: FormEvent) {
    e.preventDefault();
    await api("/api/backup/restore", {
      method: "POST",
      body: JSON.stringify({ sql: restoreSql }),
    });
    setRestoreSql("");
    alert("Restore ok – bitte neu laden.");
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Aufgaben & Inventar</h1>
          <p>Kollaboration, Einkaufsliste und Backup.</p>
        </div>
        {user?.role === "admin" ? (
          <button className="btn secondary" onClick={() => void downloadBackup()}>
            Backup
          </button>
        ) : null}
      </div>

      <div className="grid cols-2">
        <section className="panel stack">
          <h3>Aufgaben</h3>
          <form className="row" onSubmit={addTask}>
            <label className="field">
              Titel
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <button className="btn">Add</button>
          </form>
          <ul className="list">
            {tasks.map((t) => (
              <li key={t.id}>
                <span style={{ opacity: t.done ? 0.5 : 1 }}>{t.title}</span>
                <button className="btn secondary" onClick={() => void toggleTask(t)}>
                  {t.done ? "Öffnen" : "Erledigt"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel stack">
          <h3>Inventar / Einkauf</h3>
          <form className="row" onSubmit={addItem}>
            <label className="field">
              Artikel
              <input value={itemName} onChange={(e) => setItemName(e.target.value)} required />
            </label>
            <button className="btn">Add</button>
          </form>
          <ul className="list">
            {items.map((i) => (
              <li key={i.id}>
                <span>
                  {i.name} ({i.quantity} {i.unit})
                </span>
                <button className="btn secondary" onClick={() => void toggleShopping(i)}>
                  {i.shopping ? "Auf Liste" : "Vorrat"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {user?.role === "admin" && getMode() === "server" ? (
        <section className="panel stack" style={{ marginTop: "1rem" }}>
          <h3>Backup wiederherstellen</h3>
          <form className="stack" onSubmit={restoreBackup}>
            <textarea
              value={restoreSql}
              onChange={(e) => setRestoreSql(e.target.value)}
              rows={6}
              placeholder="Inhalt von hortis-backup.sql einfügen"
            />
            <button className="btn danger">Restore ausführen</button>
          </form>
        </section>
      ) : null}

      {user?.role === "admin" ? (
        <section className="panel stack" style={{ marginTop: "1rem" }}>
          <h3>Mitglied anlegen</h3>
          <form className="grid cols-3" onSubmit={registerMember}>
            <label className="field">
              Name
              <input value={memberName} onChange={(e) => setMemberName(e.target.value)} required />
            </label>
            <label className="field">
              E-Mail
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
              />
            </label>
            <label className="field">
              Passwort
              <input
                type="password"
                minLength={8}
                value={memberPassword}
                onChange={(e) => setMemberPassword(e.target.value)}
                required
              />
            </label>
            <button className="btn">Registrieren</button>
          </form>
          {msg ? <div className="badge">{msg}</div> : null}
        </section>
      ) : null}
    </div>
  );
}
