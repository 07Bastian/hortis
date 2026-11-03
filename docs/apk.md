# Hortis Android APK (Capacitor)

## Braucht die APK einen Server?

**Nein, nicht zwingend.** Standard ist **Local-Modus**: Daten liegen in IndexedDB auf dem Gerät.

| Modus | Wann | Daten |
|-------|------|--------|
| **Local** | APK allein, unterwegs | nur Gerät |
| **Server** | Homelab/VPS, Sync Familie | Self-Host-API |

Umschalten in der App unter **Einstellungen → Betriebsmodus**.

## Voraussetzungen

- Node 20+
- Android Studio (SDK + Build Tools)

## Schritte

```bash
npm install
npm run build -w @hortis/shared
npm run build -w @hortis/care-engine
npm run build -w @hortis/garden-engine
npm run build -w @hortis/bonsai-engine
npm run build -w @hortis/web
npm install -w @hortis/mobile
cd apps/mobile
npx cap add android   # einmalig
npx cap sync android
npx cap open android
```

Login Local: `admin@hortis.local` / `hortis-admin-change-me`

## Optional: Server-Modus

In den App-Einstellungen API-URL setzen, z. B. `http://192.168.1.50:8787`, Modus **Server**, neu laden.

Oder für Dev `server.url` in `capacitor.config.ts` setzen und `npx cap sync`.
