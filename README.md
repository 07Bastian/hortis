# Hortis

**Hortis** – App für Zimmerpflanzen, Bonsai und Garten/Selbstversorgung.
Web-UI und Android (Capacitor) mit optionalem eigenen Server.

OSS-Hinweise und Herkunftsnotizen: [LICENSES/NOTICE.md](LICENSES/NOTICE.md), Feature-Überblick: [docs/feature-map.md](docs/feature-map.md).

## Wetter-Standort

Standard: **Murnau / Hof** (`47.6779, 11.2012`).

- In der App: **Einstellungen → Wetter-Standort** (Latitude/Longitude + Label)
- Oder in `.env`: `HORTIS_WEATHER_LAT` / `HORTIS_WEATHER_LON`
- Quelle: [Open-Meteo](https://open-meteo.com/) (kein API-Key)

## Themes / Grow / Optimizer

- **Themes:** Forest, Clay, Midnight, Orchid, Paper (Sidebar + Einstellungen)
- **Grow:** GDD-Phasen aus Wetter + EC-Mischrechner (`/grow`)
- **Beet-Optimizer:** unter Garten → Layout-Optimizer (fresh / fit-to-current)
- **K8s (optional):** nur Hortis selbst — siehe [docs/k8s.md](docs/k8s.md)

## Benachrichtigungen & Kalender

Unter **Einstellungen**:

- SMTP-Mail, Telegram-Bot, Signal-Webhook, Browser-Push (VAPID)
- Testnachricht senden
- Kalender `.ics` exportieren / importieren
- API: `POST /api/reminders/digest` sendet überfällige Pflege an alle aktiven Kanäle

## Server oder nur APK?

- **APK allein (Local):** ja — Daten auf dem Gerät (IndexedDB), kein Server nötig  
- **Server + Web/APK:** empfohlen für Familie, Backup, Wetter-live, PlantNet, Push/Mail  
- **Sync:** Einstellungen → Local↔Server push/pull oder JSON-Datei (`hortis-sync-v1`)
- **PWA:** installierbar im Browser; HTTPS siehe [docs/proxy.md](docs/proxy.md)
- **Saatgut:** Katalog DE/EN/Latein, Lizenz, Generation, Fruchtfolge-Vorschläge

Umschalten: **Einstellungen → Betriebsmodus**.

## Quick start (Dev)

```bash
cp .env.example .env
npm install
npm run build -w @hortis/shared
npm run build -w @hortis/care-engine
npm run build -w @hortis/garden-engine
npm run build -w @hortis/bonsai-engine
npm run dev:api
# anderes Terminal:
npm run dev:web
```

- Web: http://localhost:5173  
- API: http://localhost:8787  
- Login: `admin@hortis.local` / `hortis-admin-change-me` (via `.env` ändern)

## Docker (lokal)

Ein Container liefert **API + Web-UI** für Zimmer, Bonsai und Garten.

```bash
# Doppelklick oder:
start-hortis.bat
# bzw.
docker compose up -d --build
```

- UI/API: http://localhost:8787  
- Login: `admin@hortis.local` / `hortis-admin-change-me` (via `.env` ändern)  
- Stoppen: `stop-hortis.bat`  
- Dev mit Vite: weiterhin `npm run dev:api` + `npm run dev:web` (Port 5173) — nicht parallel zu Docker auf demselben API-Port.

## Android APK

1. `npm run build -w @hortis/web`
2. `npm install -w @hortis/mobile`
3. In `apps/mobile`: `npx cap add android` (einmalig), dann `npm run mobile:android`
4. In Android Studio APK bauen. Server-URL in der App auf eure Hortis-Instanz zeigen lassen (LAN-IP).

## Struktur

- `apps/api` – Fastify + SQLite
- `apps/web` – React UI
- `apps/mobile` – Capacitor
- `packages/*-engine` – Domänenlogik
- `vendor/` – OSS-Referenzquellen
