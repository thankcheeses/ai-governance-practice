/**
 * The colour schemes, as data.
 *
 * There are three, and the person studying picks one. `tiers` is the default
 * and the only one that can be the *installed* identity: a web manifest has
 * exactly one `theme_color`, `viewport.themeColor` one value per colour
 * scheme, and the launch images are generated per light/dark. So the manifest,
 * the theme colour and the 26 splash PNGs all follow `tiers`, and the other two
 * are in-app choices. `src/lib/pwa-splash.ts` reads INSTALLED_BACKGROUNDS from
 * here rather than declaring its own, and `pwa.test.ts` holds the manifest to
 * it.
 *
 * This file is the single source of truth for every hex value. The blocks in
 * `src/app/palettes.css` are GENERATED from it by
 * `scripts/build-palette-css.mjs` (`npm run build:palettes`) — do not edit that
 * file by hand. Hand-maintaining the same colour in a stylesheet and a module
 * is how a palette ends up half-applied, which is a class of bug that looks
 * like a rendering problem and isn't.
 *
 * Every palette must define every token in both modes. That is not a
 * convention, it is asserted: a missing token would silently fall through to
 * whichever block the cascade reached last, which is a different palette.
 */

export type PaletteId = "tiers" | "quiz" | "mint";
export type Mode = "light" | "dark";

export const DEFAULT_PALETTE: PaletteId = "tiers";

/** localStorage key. Namespaced like the theme and reading preferences. */
export const PALETTE_KEY = "nhid-clinical:palette";

/**
 * The token names every palette/mode pair must carry.
 *
 * `wash1..3` are the three radial gradients on `body`. They used to be
 * hardcoded warm values — a terracotta glow, a sand one and a sage one — which
 * meant the page kept a cream cast no matter what the tokens underneath it
 * said. They are per-palette now, which is the difference between changing the
 * colour scheme and changing some of it.
 */
export const TOKENS = [
  "background", "foreground",
  "card", "cardForeground",
  "popover", "popoverForeground",
  "primary", "primaryForeground", "primaryStrong",
  "accent", "accentForeground", "accentStrong", "accentSubtle", "accentTint",
  "link", "linkHover",
  "secondary", "secondaryForeground",
  "muted", "mutedForeground",
  "destructive", "destructiveForeground", "destructiveTint",
  "success", "successForeground", "successTint",
  "warning", "warningForeground",
  "insight", "insightTint", "insightForeground",
  "border", "borderStrong", "input", "ring",
  "wash1", "wash2", "wash3",
] as const;

export type TokenName = (typeof TOKENS)[number];
export type Tokens = Record<TokenName, string>;

export interface Palette {
  id: PaletteId;
  /** Shown in settings. Sentence case, no colour vocabulary in the name. */
  label: string;
  /** One line in settings, saying what it is rather than selling it. */
  description: string;
  light: Tokens;
  dark: Tokens;
}

/*
  Risk tiers.

  The accents are the four risk levels an AIGP candidate already has in their
  head, in order: indigo for the unacceptable end, teal for limited, amber for
  minimal, rose for an alert. That is where the colour comes from — it is a
  scale the subject matter already uses, not decoration applied to it.

  Teal and amber are darkened wherever they carry text. `#00a6a0` on white is
  2.6:1 and `#ffb020` is 1.8:1; both are fine as fills beside a label and
  neither can be the label.
*/
const tiers: Palette = {
  id: "tiers",
  label: "Risk tiers",
  description: "Indigo, teal and amber, keyed to the tiers of a risk scale.",
  light: {
    background: "#f7f5ff", foreground: "#1b1733",
    card: "#ffffff", cardForeground: "#1b1733",
    popover: "#ffffff", popoverForeground: "#1b1733",
    primary: "#1b1733", primaryForeground: "#ffffff", primaryStrong: "#0f0c20",
    accent: "#5b3df5", accentForeground: "#4526d6", accentStrong: "#4526d6",
    accentSubtle: "#ded7fe", accentTint: "#f1edff",
    link: "#4526d6", linkHover: "#3419ab",
    secondary: "#ece8fb", secondaryForeground: "#1b1733",
    muted: "#ece8fb", mutedForeground: "#55507a",
    destructive: "#cc2158", destructiveForeground: "#ffffff", destructiveTint: "#fdecf2",
    success: "#00756f", successForeground: "#ffffff", successTint: "#e0f5f3",
    warning: "#8a5600", warningForeground: "#ffffff",
    insight: "#ffb020", insightTint: "#fff6e3", insightForeground: "#8a5600",
    border: "rgb(27 23 51 / 0.09)", borderStrong: "rgb(27 23 51 / 0.18)",
    input: "rgb(27 23 51 / 0.18)", ring: "#5b3df5",
    wash1: "rgb(91 61 245 / 0.14)", wash2: "rgb(0 166 160 / 0.10)", wash3: "rgb(255 176 32 / 0.10)",
  },
  dark: {
    background: "#121026", foreground: "#ece9f7",
    card: "#1c1836", cardForeground: "#ece9f7",
    popover: "#1c1836", popoverForeground: "#ece9f7",
    primary: "#ece9f7", primaryForeground: "#121026", primaryStrong: "#d5d0ec",
    accent: "#9d8bff", accentForeground: "#c3b7ff", accentStrong: "#c3b7ff",
    accentSubtle: "#2e2756", accentTint: "#221d42",
    link: "#9d8bff", linkHover: "#c3b7ff",
    secondary: "#262141", secondaryForeground: "#ece9f7",
    muted: "#262141", mutedForeground: "#aaa4c6",
    destructive: "#ff7097", destructiveForeground: "#121026", destructiveTint: "#331f2c",
    success: "#45d3cc", successForeground: "#121026", successTint: "#14322f",
    warning: "#ffc257", warningForeground: "#121026",
    insight: "#ffc257", insightTint: "#2c2415", insightForeground: "#ffd98a",
    border: "rgb(236 233 247 / 0.1)", borderStrong: "rgb(236 233 247 / 0.2)",
    input: "rgb(236 233 247 / 0.2)", ring: "#9d8bff",
    wash1: "rgb(91 61 245 / 0.20)", wash2: "rgb(0 166 160 / 0.12)", wash3: "rgb(255 176 32 / 0.08)",
  },
};

/*
  Quiz show.

  The loud one. Pink carries the primary action, cobalt carries links because
  pink cannot clear 4.5:1 against white at body size, and lime is a reward
  colour only — it appears on streaks and nowhere a word has to be read off it.
*/
const quiz: Palette = {
  id: "quiz",
  label: "Quiz show",
  description: "Pink and lime, with cobalt links. The loudest of the three.",
  light: {
    background: "#fffdf7", foreground: "#15181f",
    card: "#ffffff", cardForeground: "#15181f",
    popover: "#ffffff", popoverForeground: "#15181f",
    primary: "#15181f", primaryForeground: "#ffffff", primaryStrong: "#070910",
    accent: "#ff4d7d", accentForeground: "#b3144a", accentStrong: "#b3144a",
    accentSubtle: "#ffd6e2", accentTint: "#fff0f4",
    link: "#1257cc", linkHover: "#0d3f99",
    secondary: "#f2eee4", secondaryForeground: "#15181f",
    muted: "#f2eee4", mutedForeground: "#565d6b",
    destructive: "#cc1f3d", destructiveForeground: "#ffffff", destructiveTint: "#ffecef",
    success: "#0f7a4a", successForeground: "#ffffff", successTint: "#e6f6ee",
    warning: "#8f5000", warningForeground: "#ffffff",
    insight: "#c6f24e", insightTint: "#f6fce6", insightForeground: "#4f6b00",
    border: "rgb(21 24 31 / 0.1)", borderStrong: "rgb(21 24 31 / 0.2)",
    input: "rgb(21 24 31 / 0.2)", ring: "#ff4d7d",
    wash1: "rgb(255 77 125 / 0.14)", wash2: "rgb(45 125 255 / 0.10)", wash3: "rgb(198 242 78 / 0.14)",
  },
  dark: {
    background: "#12131a", foreground: "#f4f2ee",
    card: "#1c1e28", cardForeground: "#f4f2ee",
    popover: "#1c1e28", popoverForeground: "#f4f2ee",
    primary: "#f4f2ee", primaryForeground: "#12131a", primaryStrong: "#dcd9d3",
    accent: "#ff7da1", accentForeground: "#ffb3c6", accentStrong: "#ffb3c6",
    accentSubtle: "#3a2030", accentTint: "#2a1a23",
    link: "#79aaff", linkHover: "#a8c7ff",
    secondary: "#24262f", secondaryForeground: "#f4f2ee",
    muted: "#24262f", mutedForeground: "#a8aeb9",
    destructive: "#ff7585", destructiveForeground: "#12131a", destructiveTint: "#331d22",
    success: "#4fc98a", successForeground: "#12131a", successTint: "#152d22",
    warning: "#ffc45c", warningForeground: "#12131a",
    insight: "#d6f96a", insightTint: "#242c15", insightForeground: "#e4fb9a",
    border: "rgb(244 242 238 / 0.1)", borderStrong: "rgb(244 242 238 / 0.2)",
    input: "rgb(244 242 238 / 0.2)", ring: "#ff7da1",
    wash1: "rgb(255 77 125 / 0.18)", wash2: "rgb(45 125 255 / 0.14)", wash3: "rgb(198 242 78 / 0.08)",
  },
};

/*
  Mint and grape.

  The quiet one. The mint this started as was #00b37e, which is 2.71:1 on white
  and fails even as large text, so the green that carries anything is #047857
  and the brighter mint survives only as a tint and a wash. Grape carries links.
*/
const mint: Palette = {
  id: "mint",
  label: "Mint and grape",
  description: "Green and purple on a cool page. The quietest of the three.",
  light: {
    background: "#f0faf5", foreground: "#2a1b3d",
    card: "#ffffff", cardForeground: "#2a1b3d",
    popover: "#ffffff", popoverForeground: "#2a1b3d",
    primary: "#2a1b3d", primaryForeground: "#ffffff", primaryStrong: "#1a0f28",
    accent: "#047857", accentForeground: "#036045", accentStrong: "#036045",
    accentSubtle: "#c6ece0", accentTint: "#e7f7f0",
    link: "#6d28d9", linkHover: "#551bb3",
    secondary: "#e3f1ea", secondaryForeground: "#2a1b3d",
    muted: "#e3f1ea", mutedForeground: "#55606b",
    destructive: "#c42a4e", destructiveForeground: "#ffffff", destructiveTint: "#fdecef",
    success: "#047857", successForeground: "#ffffff", successTint: "#e7f7f0",
    warning: "#8a5200", warningForeground: "#ffffff",
    insight: "#ff7a45", insightTint: "#fff0e9", insightForeground: "#9c3f14",
    border: "rgb(42 27 61 / 0.1)", borderStrong: "rgb(42 27 61 / 0.2)",
    input: "rgb(42 27 61 / 0.2)", ring: "#047857",
    wash1: "rgb(0 179 126 / 0.14)", wash2: "rgb(109 40 217 / 0.10)", wash3: "rgb(255 122 69 / 0.10)",
  },
  dark: {
    background: "#111a17", foreground: "#e9f2ed",
    card: "#1a2622", cardForeground: "#e9f2ed",
    popover: "#1a2622", popoverForeground: "#e9f2ed",
    primary: "#e9f2ed", primaryForeground: "#111a17", primaryStrong: "#d1ded8",
    accent: "#4ecfa1", accentForeground: "#8ee4c4", accentStrong: "#8ee4c4",
    accentSubtle: "#1e3a30", accentTint: "#172e26",
    link: "#b394f5", linkHover: "#cdb7fa",
    secondary: "#22302b", secondaryForeground: "#e9f2ed",
    muted: "#22302b", mutedForeground: "#a2b1ab",
    destructive: "#ff7a93", destructiveForeground: "#111a17", destructiveTint: "#33202a",
    success: "#4ecfa1", successForeground: "#111a17", successTint: "#15302a",
    warning: "#ffb570", warningForeground: "#111a17",
    insight: "#ff9b6b", insightTint: "#2e2219", insightForeground: "#ffc3a3",
    border: "rgb(233 242 237 / 0.1)", borderStrong: "rgb(233 242 237 / 0.2)",
    input: "rgb(233 242 237 / 0.2)", ring: "#4ecfa1",
    wash1: "rgb(0 179 126 / 0.18)", wash2: "rgb(109 40 217 / 0.16)", wash3: "rgb(255 122 69 / 0.08)",
  },
};

export const PALETTES: Record<PaletteId, Palette> = { tiers, quiz, mint };

/** Stable order for the settings picker and for the generated stylesheet. */
export const PALETTE_IDS: PaletteId[] = ["tiers", "quiz", "mint"];

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === "string" && (PALETTE_IDS as string[]).includes(value);
}

/** The colours the installed app is identified by: manifest, theme colour, launch images. */
export const INSTALLED_BACKGROUNDS = {
  light: PALETTES[DEFAULT_PALETTE].light.background,
  dark: PALETTES[DEFAULT_PALETTE].dark.background,
} as const;

/** The CSS custom property a token maps to: `cardForeground` -> `--card-foreground`. */
export function cssVarName(token: TokenName): string {
  return `--${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

/**
 * Runs before hydration to set the palette attribute, for the same reason the
 * theme and reading scripts do: the alternative is every visitor who chose a
 * palette seeing the default one for a frame, on every load.
 */
export const PALETTE_INIT_SCRIPT = `
(function(){try{
var p=localStorage.getItem('${PALETTE_KEY}');
document.documentElement.setAttribute('data-palette',${JSON.stringify(PALETTE_IDS)}.indexOf(p)<0?'${DEFAULT_PALETTE}':p);
}catch(e){document.documentElement.setAttribute('data-palette','${DEFAULT_PALETTE}');}})();
`.trim();
