# Hortis

Self-hosted App für **Zimmerpflanzen**, **Bonsai** und **Garten/Selbstversorgung**.
Web-UI + Android (Capacitor) gegen dieselbe API.

Inspiriert von / portiert aus: HortusFox, OlsGrow, Plant-it, Gardener, Beet Anything, Kamerplanter.
Siehe [docs/feature-map.md](docs/feature-map.md) und [LICENSES/NOTICE.md](LICENSES/NOTICE.md).

## Wetter-Standort

Standard: **Murnau / Hof** (`47.6779, 11.2012`).

- In der App: **Einstellungen → Wetter-Standort** (Latitude/Longitude + Label)
- Oder in `.env`: `HORTIS_WEATHER_LAT` / `HORTIS_WEATHER_LON`
- Quelle: [Open-Meteo](https://open-meteo.com/) (kein API-Key)

## Benachrichtigungen & Kalender

Unter **Einstellungen**:

- SMTP-Mail, Telegram-Bot, Signal-Webhook, Browser-Push (VAPID)
- Testnachricht senden
- Kalender `.ics` exportieren / importieren
- API: `POST /api/reminders/digest` sendet überfällige Pflege an alle aktiven Kanäle

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

## Docker

```bash
docker compose up -d --build
```

API/UI-Static: Port `8787`. Für die Dev-UI mit Vite weiterhin `npm run dev:web` nutzen oder Web-Build vom API-Host ausliefern.

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
