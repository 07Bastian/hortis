# Hortis Android APK (Capacitor)

## Braucht die APK einen Server?

**Nein.** Standard ist **Local-Modus** (IndexedDB). Optional Server-Sync unter Einstellungen.

## Build

`apps/mobile/android/` wird lokal erzeugt (nicht im Git) und mit Cap sync befüllt.

```bash
npm install
npm run build
npm install -w @hortis/mobile
cd apps/mobile
npx cap add android   # einmalig, falls android/ fehlt
npx cap sync android
npx cap open android
```

In Android Studio: Build → Build APK(s) / Generate Signed Bundle.

Login Local: `admin@hortis.local` / `hortis-admin-change-me`

## Sync

1. Server erreichbar machen (LAN-IP + Port oder HTTPS).
2. Einstellungen → Betriebsmodus **Server**, API-URL setzen.
3. Oder Local lassen und **Local → Server pushen** (Admin-Token/Login auf Server).

## Signing

Release-Keystore in Android Studio anlegen; Debug-APK nur für Tests.
