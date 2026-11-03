import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "local.hortis.app",
  appName: "Hortis",
  webDir: "../web/dist",
  server: {
    // Point the APK at your self-hosted instance when not bundling static-only mode.
    // For local LAN testing, set url to http://<host-ip>:8787 after serving the web build from the API.
    androidScheme: "https",
  },
};

export default config;
