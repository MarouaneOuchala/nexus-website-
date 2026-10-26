import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ma.nexusacademy.dashboard",
  appName: "NEXUS Dashboard",
  webDir: "out",
  server: {
    appStartPath: "/admin/",
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
  },
};

export default config;
