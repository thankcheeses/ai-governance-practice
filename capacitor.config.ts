import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wraps the static export in ./out as a native shell.
 *
 * The native platform folders (android/, ios/) are intentionally NOT committed.
 * They are generated output, need the Android SDK / Xcode to build, and add
 * thousands of files. Generate them where you have those toolchains:
 *
 *   npm run build:mobile
 *   npx cap add android      # requires Android Studio + SDK
 *   npx cap add ios          # requires macOS + Xcode
 *
 * After the first `cap add`, `npm run mobile:sync` rebuilds the web bundle and
 * copies it into both platforms.
 *
 * Web assets are bundled rather than pointed at a remote URL, so the app works
 * offline — study content is local anyway, and Apple review treats a thin
 * remote-URL wrapper as grounds for rejection under guideline 4.2.
 */
const config: CapacitorConfig = {
  appId: "com.judgmentlabs.app",
  appName: "Judgment Labs",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  ios: {
    // Keeps content clear of the notch and home indicator; the app's own
    // safe-area padding then handles the rest.
    contentInset: "always",
    // Pinch-zoom would break the fixed question layout.
    zoomEnabled: false,
    backgroundColor: "#FAFAF9",
  },
  android: {
    zoomEnabled: false,
    backgroundColor: "#FAFAF9",
  },
};

export default config;
