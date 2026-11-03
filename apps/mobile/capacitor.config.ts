import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Default APK = bundled web UI in **local mode** (IndexedDB, no server).
 * For server mode: set hortis_mode=server in the app settings and API URL,
 * or temporarily set `server.url` below to your LAN Hortis instance.
 */
const config: CapacitorConfig = {
  appId: "local.hortis.app",
  appName: "Hortis",
  webDir: "../web/dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
