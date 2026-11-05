import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import {
  LAUNCH_BACKGROUNDS,
  LAUNCH_DEVICES,
  launchImageName,
  startupImages,
  type LaunchScheme,
} from "@/lib/pwa-splash";

/**
 * The installable-app wiring, checked against the files on disk.
 *
 * Every defect this guards against is silent by construction. A manifest icon
 * that 404s, a launch image whose dimensions do not match the media query that
 * selects it, a touch icon in a format iOS ignores — none of them throws, none
 * of them shows up in a build, and all of them only appear when somebody
 * installs the app on a phone, which is the one thing CI cannot do. So the
 * assertions here read the bytes rather than the declarations.
 */

/** PNG dimensions straight out of the IHDR chunk, so no image library. */
function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  assert.equal(
    buf.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
    `${path} is not a PNG`,
  );
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const manifest = JSON.parse(
  readFileSync("public/manifest.webmanifest", "utf8"),
) as {
  start_url: string;
  scope: string;
  display: string;
  theme_color: string;
  background_color: string;
  icons: { src: string; sizes: string; type: string; purpose: string }[];
};

test("the manifest's paths stay relative to it", () => {
  /*
    The app is served from a repository sub-path on Pages and from the
    filesystem root under Capacitor. A leading-slash `start_url` resolves
    against the origin, so on Pages it would point at the user site's root —
    the app would install and then open somebody else's page. Relative URLs
    resolve against the manifest, which is correct for both targets with no
    build-time substitution at all.
  */
  assert.ok(
    !manifest.start_url.startsWith("/"),
    "start_url is absolute; on a project site it resolves off the app",
  );
  assert.ok(!manifest.scope.startsWith("/"), "scope is absolute");
  for (const icon of manifest.icons) {
    assert.ok(!icon.src.startsWith("/"), `${icon.src} is absolute`);
  }
});

test("the manifest asks for a full-screen app", () => {
  assert.equal(manifest.display, "standalone");
});

test("the manifest's colours are the app's own background", () => {
  // Both must match the light `--background` token, or an install flashes a
  // colour the app never uses before first paint.
  const css = readFileSync("src/app/globals.css", "utf8");
  const light = /--background:\s*(#[0-9a-f]{6})/i.exec(css)?.[1];
  assert.ok(light, "could not read --background from globals.css");
  assert.equal(manifest.theme_color.toLowerCase(), light.toLowerCase());
  assert.equal(manifest.background_color.toLowerCase(), light.toLowerCase());
});

/**
 * Where a manifest icon's bytes actually live.
 *
 * Two different mechanisms serve icons at the same root. `public/` is copied
 * verbatim, and `src/app/icon.svg` is Next's file convention, which emits
 * `icon.svg` at the root of the export too. A manifest entry can legitimately
 * be served by either, so both are searched — resolving only against `public/`
 * reported the SVG icon as missing when it is in fact served.
 */
function iconPath(src: string): string | null {
  for (const base of ["public", "src/app"]) {
    if (existsSync(`${base}/${src}`)) return `${base}/${src}`;
  }
  return null;
}

test("every manifest icon exists, at the size it claims", () => {
  for (const icon of manifest.icons) {
    const path = iconPath(icon.src);
    assert.ok(path, `${icon.src} is declared but served by nothing`);
    if (icon.type !== "image/png") continue;
    const [w, h] = icon.sizes.split("x").map(Number);
    const actual = pngSize(path);
    assert.deepEqual(
      actual,
      { width: w, height: h },
      `${icon.src} is ${actual.width}x${actual.height}, declared ${icon.sizes}`,
    );
  }
});

test("the manifest carries the two sizes Chrome requires, and a maskable", () => {
  const png = manifest.icons.filter((i) => i.type === "image/png");
  for (const size of ["192x192", "512x512"]) {
    assert.ok(
      png.some((i) => i.sizes === size && i.purpose === "any"),
      `no ${size} PNG icon — Chrome will not offer to install`,
    );
  }
  assert.ok(
    png.some((i) => i.purpose === "maskable"),
    "no maskable PNG: Android crops the mark to fit its own shape",
  );
});

test("the touch icon is a PNG, because iOS ignores an SVG one", () => {
  /*
    This is the bug the icon work started from. `src/app/apple-icon.svg`
    emitted a perfectly valid <link rel="apple-touch-icon">, and iOS ignored
    it, so a home-screen install showed a screenshot of the page instead of the
    mark. Nothing reported it: the link was there, the file was there, and the
    format was simply unsupported.
  */
  assert.ok(
    existsSync("src/app/apple-icon.png"),
    "no apple-icon.png for Next's file convention to pick up",
  );
  assert.ok(
    !existsSync("src/app/apple-icon.svg"),
    "apple-icon.svg is back; iOS cannot read it and will prefer nothing",
  );
  const { width, height } = pngSize("src/app/apple-icon.png");
  assert.deepEqual({ width, height }, { width: 180, height: 180 });
});

test("every launch image exists at exactly the geometry its media query selects", () => {
  // The whole mechanism turns on this equality: iOS matches on device
  // geometry, and a file whose pixels disagree with the query that chose it is
  // either stretched or dropped.
  for (const device of LAUNCH_DEVICES) {
    for (const scheme of Object.keys(LAUNCH_BACKGROUNDS) as LaunchScheme[]) {
      const path = `public/splash/${launchImageName(device, scheme)}`;
      assert.ok(existsSync(path), `${path} is missing — re-run the generator`);
      const actual = pngSize(path);
      assert.deepEqual(
        actual,
        { width: device.w * device.r, height: device.h * device.r },
        `${path} does not match ${device.device}`,
      );
    }
  }
});

test("the startup image metadata covers the table, and nothing else", () => {
  const schemes = Object.keys(LAUNCH_BACKGROUNDS).length;
  assert.equal(startupImages.length, LAUNCH_DEVICES.length * schemes);

  for (const { url, media } of startupImages) {
    assert.ok(media, "an entry has no media query, so iOS cannot select it");
    // Next emits these as given — see the note in src/lib/base-path.ts.
    assert.ok(
      url.startsWith(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/splash/`),
      `${url} is not prefixed with the base path`,
    );
    assert.match(media, /\(orientation: portrait\)/);
    assert.match(media, /prefers-color-scheme: (light|dark)/);
  }
});

test("the service worker precaches the screens the navigation offers", () => {
  /*
    Offline used to mean the landing page and `study/`. Everything else fell
    through to the offline shell, so the first tap on Review or Exam showed the
    wrong screen — which reads as a broken app rather than as a missing cache
    entry. The questions are in the JS bundle, already cached; only the shells
    were missing.
  */
  const sw = readFileSync("public/sw.js", "utf8");
  const shell = /const SHELL = \[([\s\S]*?)\];/.exec(sw)?.[1] ?? "";
  for (const route of ["home/", "study/", "review/", "exam/", "dashboard/"]) {
    assert.ok(
      shell.includes(`at("${route}")`),
      `${route} is not precached, so it does not load offline`,
    );
  }
  assert.match(
    sw,
    /splash\//,
    "launch images are not cacheable, so an offline launch has none",
  );
});

test("the install button only acts on what the browser actually offers", () => {
  const source = readFileSync("src/components/app/install-app.tsx", "utf8");
  // Without preventDefault Chrome shows its own infobar and the in-page
  // button is redundant; without the listener there is nothing to install with.
  assert.match(source, /beforeinstallprompt/);
  assert.match(source, /preventDefault\(\)/);
  // Hides itself once installed, and never appears in the native shell.
  assert.match(source, /appinstalled/);
  assert.match(source, /display-mode: standalone/);
  assert.match(source, /NEXT_PUBLIC_MOBILE_BUILD/);
});

test("the prerendered document carries a main landmark", () => {
  /*
    Found by Lighthouse, and it was real: every in-app route prerenders to
    `AppGate`'s loading branch, because progress hydrates in the browser. That
    branch was a plain <div>, so the document in the export had no landmark —
    `AppShell`'s <main> only appears after hydration. Asserted on both files
    because the defect is the pair: one <main> in each branch, never two at
    once, never none.
  */
  const gate = readFileSync("src/components/app/app-gate.tsx", "utf8");
  assert.match(gate, /<main className="flex min-h-dvh/, "the loading state is not a <main>");
  const shell = readFileSync("src/components/app/app-shell.tsx", "utf8");
  assert.equal(
    (shell.match(/<main[\s>]/g) ?? []).length,
    1,
    "AppShell should have exactly one <main>",
  );
});
