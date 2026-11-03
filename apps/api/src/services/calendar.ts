import { db } from "../db.js";

function fold(line: string): string {
  return line.replace(/\n/g, "\\n");
}

export function exportIcal(): string {
  const tasks = db
    .prepare(
      `SELECT id, title, due_at, done FROM tasks WHERE due_at IS NOT NULL ORDER BY due_at`,
    )
    .all() as { id: string; title: string; due_at: string; done: number }[];
  const reminders = db
    .prepare(
      `SELECT r.id, r.event_type, r.interval_days, p.name as plant_name
       FROM care_reminders r JOIN plants p ON p.id = r.plant_id
       WHERE r.active = 1`,
    )
    .all() as {
    id: string;
    event_type: string;
    interval_days: number;
    plant_name: string;
  }[];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hortis//DE",
    "CALSCALE:GREGORIAN",
  ];

  for (const t of tasks) {
    const day = t.due_at.slice(0, 10).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:task-${t.id}@hortis`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART;VALUE=DATE:${day}`,
      `SUMMARY:${fold(t.title)}${t.done ? " (erledigt)" : ""}`,
      "END:VEVENT",
    );
  }

  const now = new Date();
  for (const r of reminders) {
    const due = new Date(now.getTime() + r.interval_days * 86400000);
    const day = due.toISOString().slice(0, 10).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:reminder-${r.id}@hortis`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART;VALUE=DATE:${day}`,
      `SUMMARY:${fold(`${r.event_type}: ${r.plant_name}`)}`,
      `DESCRIPTION:Hortis Pflege-Reminder alle ${r.interval_days} Tage`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Import VEVENT SUMMARY + DTSTART into tasks. */
export function importIcal(ics: string): number {
  const blocks = ics.split("BEGIN:VEVENT");
  let count = 0;
  const insert = db.prepare(
    `INSERT INTO tasks (id, title, due_at, plant_id, bed_id, done, assignee_id, created_at)
     VALUES (?, ?, ?, NULL, NULL, 0, NULL, ?)`,
  );
  for (const block of blocks.slice(1)) {
    const summary = /SUMMARY:(.+)/i.exec(block)?.[1]?.trim();
    const dt =
      /DTSTART(?:;VALUE=DATE)?:([0-9T]+Z?)/i.exec(block)?.[1] ??
      /DTSTART;[^:]*:([0-9]+)/i.exec(block)?.[1];
    if (!summary || !dt) continue;
    let due: string;
    if (dt.length === 8) {
      due = `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}T09:00:00.000Z`;
    } else {
      const raw = dt.endsWith("Z") ? dt : `${dt}Z`;
      due = new Date(
        raw.replace(
          /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
          "$1-$2-$3T$4:$5:$6Z",
        ),
      ).toISOString();
    }
    insert.run(crypto.randomUUID(), summary.replace(/\\n/g, " "), due, new Date().toISOString());
    count += 1;
  }
  return count;
}
