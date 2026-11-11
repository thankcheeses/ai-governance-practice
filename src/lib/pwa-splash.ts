import { withBasePath } from "@/lib/base-path";
import { INSTALLED_BACKGROUNDS } from "@/lib/palette";

/**
 * The iOS launch images, and the one table the generator and the metadata both
 * read.
 *
 * iOS matches a launch image by exact device geometry, so a hand-written list
 * of `media` strings beside a hand-written list of filenames is two places for
 * the same number to be wrong in. Both are derived from the table below
 * instead: `scripts/build-pwa-assets.ts` imports it to decide what to render,
 * and `startupImages` below turns the same rows into the metadata Next emits.
 * A device added in one place therefore cannot be missing from the other.
 *
 * Portrait only. A home-screen launch is portrait on iPhone, and a landscape
 * iPad launch falls back to the manifest's `background_color`, which is the
 * same colour these images are painted in — so the fallback is a plain
 * background rather than a wrong one.
 */
export interface LaunchDevice {
  /** CSS pixels. */
  w: number;
  h: number;
  /** Device pixel ratio. */
  r: number;
  /** What it is, so a row can be judged without looking it up. */
  device: string;
}

export const LAUNCH_DEVICES: readonly LaunchDevice[] = [
  { w: 440, h: 956, r: 3, device: "iPhone 16 Pro Max" },
  { w: 430, h: 932, r: 3, device: "iPhone 14/15 Pro Max" },
  { w: 402, h: 874, r: 3, device: "iPhone 16 Pro" },
  { w: 393, h: 852, r: 3, device: "iPhone 14/15/16 Pro" },
  { w: 428, h: 926, r: 3, device: "iPhone 12/13/14 Plus" },
  { w: 390, h: 844, r: 3, device: "iPhone 12/13/14" },
  { w: 375, h: 812, r: 3, device: "iPhone X/XS/11 Pro, 12/13 mini" },
  { w: 414, h: 896, r: 2, device: "iPhone XR/11" },
  { w: 375, h: 667, r: 2, device: "iPhone SE" },
  { w: 1024, h: 1366, r: 2, device: 'iPad Pro 12.9"' },
  { w: 834, h: 1194, r: 2, device: 'iPad Pro 11"' },
  { w: 820, h: 1180, r: 2, device: "iPad Air" },
  { w: 744, h: 1133, r: 2, device: "iPad mini" },
];

/**
 * The surfaces the images are painted on.
 *
 * Re-exported from `src/lib/palette.ts` rather than declared here. A launch
 * image in any other colour flashes the wrong colour for the moment before
 * first paint, which is the whole thing it exists to prevent — and a second
 * copy of the hex is exactly how that drifts.
 *
 * There are three palettes and only one set of launch images, because the
 * images are files and the choice is made at runtime. They follow the default
 * palette; someone studying in another palette sees the default one for the
 * moment before first paint, which is strictly better than the wrong colour
 * entirely and is the same tradeoff the manifest's single `theme_color` forces.
 */
export const LAUNCH_BACKGROUNDS = INSTALLED_BACKGROUNDS;

export type LaunchScheme = keyof typeof LAUNCH_BACKGROUNDS;

/** Named by pixel size, so devices that share a geometry share a file. */
export function launchImageName(
  device: LaunchDevice,
  scheme: LaunchScheme,
): string {
  return `launch-${device.w * device.r}x${device.h * device.r}-${scheme}.png`;
}

/**
 * `appleWebApp.startupImage` entries.
 *
 * Prefixed with the base path for the same reason the `manifest` field is:
 * Next emits these URLs as given, so on a project site an unprefixed
 * `/splash/...` resolves to the user site's root and 404s.
 */
export interface StartupImage {
  url: string;
  media: string;
}

export const startupImages: StartupImage[] = LAUNCH_DEVICES.flatMap((device) =>
  (Object.keys(LAUNCH_BACKGROUNDS) as LaunchScheme[]).map((scheme) => ({
    url: withBasePath(`/splash/${launchImageName(device, scheme)}`),
    media: [
      `(prefers-color-scheme: ${scheme})`,
      `(device-width: ${device.w}px)`,
      `(device-height: ${device.h}px)`,
      `(-webkit-device-pixel-ratio: ${device.r})`,
      "(orientation: portrait)",
    ].join(" and "),
  })),
);
