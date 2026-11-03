# Hortis Android APK (Capacitor)

## Voraussetzungen

- Node 20+
- Android Studio (SDK + Build Tools)
- Laufende Hortis-API (z. B. `http://192.168.x.x:8787` im LAN)

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

In Android Studio: Run / Build APK.

## API-URL in der App

Die gebündelte Web-UI spricht relative `/api`-Pfade an. Für native APKs:

1. Entweder reverse-proxy (App lädt UI+API von derselben Origin), oder
2. In `apps/mobile/capacitor.config.ts` unter `server.url` die Hortis-URL setzen und neu syncen.

Beispiel:

```ts
server: {
  url: "http://192.168.1.50:8787",
  cleartext: true,
}
```

Danach erneut `npx cap sync android`.
