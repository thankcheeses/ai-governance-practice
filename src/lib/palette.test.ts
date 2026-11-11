import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  cssVarName,
  DEFAULT_PALETTE,
  INSTALLED_BACKGROUNDS,
  isPaletteId,
  PALETTE_IDS,
  PALETTE_INIT_SCRIPT,
  PALETTES,
  TOKENS,
  type Mode,
  type TokenName,
  type Tokens,
} from "@/lib/palette";

/* ---------- WCAG 2.1 contrast, so the floors below are measured ---------- */

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Accepts `#rrggbb`. `rgb(r g b / a)` is rejected: see `isTranslucent`. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  assert.match(h, /^[0-9a-f]{6}$/i, `not an opaque hex colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Borders and washes are deliberately translucent and carry no text. */
const isTranslucent = (value: string) => value.startsWith("rgb(");

/**
 * The pairs that actually appear on screen, each with the floor its role needs.
 *
 * Body copy is held to AAA rather than AA. The content here is dense
 * regulatory prose read in long sittings on a phone, which is the case the
 * higher floor exists for; 4.5:1 is a minimum for incidental text, not a
 * target for the thing the product is.
 */
const PAIRS: Array<[fg: TokenName, bg: TokenName, floor: number, role: string]> = [
  ["foreground", "background", 7, "body copy on the page"],
  ["cardForeground", "card", 7, "body copy on a card"],
  ["popoverForeground", "popover", 7, "body copy in a popover"],
  ["mutedForeground", "background", 4.5, "secondary text on the page"],
  ["mutedForeground", "card", 4.5, "secondary text on a card"],
  ["link", "background", 4.5, "a link on the page"],
  ["link", "card", 4.5, "a link on a card"],
  ["linkHover", "card", 4.5, "a hovered link"],
  ["accentStrong", "card", 4.5, "accent text on a card"],
  ["accentForeground", "accentTint", 4.5, "accent text in a tinted callout"],
  ["insightForeground", "insightTint", 4.5, "insight text in its callout"],
  ["primaryForeground", "primary", 4.5, "a primary button's label"],
  ["destructiveForeground", "destructive", 4.5, "a destructive button's label"],
  ["successForeground", "success", 4.5, "a success button's label"],
  ["warningForeground", "warning", 4.5, "a warning button's label"],
  ["foreground", "secondary", 4.5, "body copy on a secondary surface"],
  ["foreground", "muted", 4.5, "body copy on a muted surface"],
  ["foreground", "destructiveTint", 4.5, "body copy in a wrong-answer callout"],
  ["foreground", "successTint", 4.5, "body copy in a right-answer callout"],
  ["foreground", "accentTint", 4.5, "body copy in an accent callout"],
  ["foreground", "insightTint", 4.5, "body copy in an insight callout"],
];

const MODES: Mode[] = ["light", "dark"];

/* ---------- structure ---------- */

test("every palette defines every token in both modes", () => {
  for (const id of PALETTE_IDS) {
    const palette = PALETTES[id];
    assert.equal(palette.id, id, `PALETTES['${id}'].id disagrees with its key`);
    for (const mode of MODES) {
      const tokens: Tokens = palette[mode];
      for (const token of TOKENS) {
        const value = tokens[token];
        assert.ok(
          typeof value === "string" && value.length > 0,
          `${id}/${mode} is missing '${token}'. A missing token falls through to ` +
            "whichever block the cascade reached last, which is another palette.",
        );
      }
      // And nothing extra, which would be a token the stylesheet never emits.
      const extra = Object.keys(tokens).filter(
        (k) => !(TOKENS as readonly string[]).includes(k),
      );
      assert.deepEqual(extra, [], `${id}/${mode} declares tokens not in TOKENS`);
    }
  }
});

test("every colour value is an opaque hex or a translucent rgb()", () => {
  for (const id of PALETTE_IDS) {
    for (const mode of MODES) {
      for (const [token, value] of Object.entries(PALETTES[id][mode])) {
        const ok = /^#[0-9a-f]{6}$/i.test(value) || /^rgb\([^)]+\)$/.test(value);
        assert.ok(ok, `${id}/${mode}.${token} is not a usable colour: ${value}`);
      }
    }
  }
});

test("only borders, inputs and washes are translucent", () => {
  const mayBeTranslucent = new Set(["border", "borderStrong", "input", "wash1", "wash2", "wash3"]);
  for (const id of PALETTE_IDS) {
    for (const mode of MODES) {
      for (const [token, value] of Object.entries(PALETTES[id][mode])) {
        if (isTranslucent(value)) {
          assert.ok(
            mayBeTranslucent.has(token),
            `${id}/${mode}.${token} is translucent; a colour text sits on cannot be, ` +
              "because its measured contrast would depend on what is behind it",
          );
        }
      }
    }
  }
});

/* ---------- contrast ---------- */

for (const id of PALETTE_IDS) {
  for (const mode of MODES) {
    test(`${id}/${mode} clears its contrast floors`, () => {
      const tokens = PALETTES[id][mode];
      const failures: string[] = [];
      for (const [fg, bg, floor, role] of PAIRS) {
        const ratio = contrast(tokens[fg], tokens[bg]);
        if (ratio < floor) {
          failures.push(
            `  ${role}: ${fg} (${tokens[fg]}) on ${bg} (${tokens[bg]}) ` +
              `is ${ratio.toFixed(2)}:1, needs ${floor}:1`,
          );
        }
      }
      assert.deepEqual(failures, [], `\n${failures.join("\n")}\n`);
    });
  }
}

/* ---------- the installed identity ---------- */

test("the installed background colours come from the default palette", () => {
  assert.equal(INSTALLED_BACKGROUNDS.light, PALETTES[DEFAULT_PALETTE].light.background);
  assert.equal(INSTALLED_BACKGROUNDS.dark, PALETTES[DEFAULT_PALETTE].dark.background);
});

test("the default palette is one of the palettes", () => {
  assert.ok(PALETTE_IDS.includes(DEFAULT_PALETTE));
  assert.ok(isPaletteId(DEFAULT_PALETTE));
  assert.equal(isPaletteId("not-a-palette"), false);
  assert.equal(isPaletteId(undefined), false);
});

/* ---------- the generated stylesheet ---------- */

test("palettes.css is in step with this module", () => {
  const css = readFileSync("src/app/palettes.css", "utf8");
  for (const id of PALETTE_IDS) {
    for (const mode of MODES) {
      const tokens = PALETTES[id][mode];
      for (const token of TOKENS) {
        const decl = `${cssVarName(token)}: ${tokens[token]};`;
        assert.ok(
          css.includes(decl),
          `src/app/palettes.css is stale: ${id}/${mode} expects '${decl}'. ` +
            "Run `npm run build:palettes`.",
        );
      }
    }
  }
});

test("cssVarName converts camelCase to a custom property", () => {
  assert.equal(cssVarName("background"), "--background");
  assert.equal(cssVarName("cardForeground"), "--card-foreground");
  assert.equal(cssVarName("accentSubtle"), "--accent-subtle");
});

/* ---------- the one place the colours must be literal ---------- */

/*
  `src/app/global-error.tsx` renders when the app failed to start, which
  includes the case where the stylesheet never loaded, so it cannot read a
  token and has the default palette's colours written into it by hand. That is
  the only such place, and this is what stops it being left behind: without it,
  a palette change ships a crash screen in the previous scheme and nothing
  says so.
*/
test("the global error screen carries the default palette's colours", () => {
  const source = readFileSync("src/app/global-error.tsx", "utf8");
  const fallback = PALETTES[DEFAULT_PALETTE];
  const required: Array<[string, string]> = [
    ["light background", fallback.light.background],
    ["light foreground", fallback.light.foreground],
    ["dark background", fallback.dark.background],
    ["dark foreground", fallback.dark.foreground],
  ];
  for (const [role, value] of required) {
    assert.ok(
      source.toLowerCase().includes(value.toLowerCase()),
      `global-error.tsx is missing the default palette's ${role} (${value}). ` +
        "It cannot read tokens, so these four are literal and have to be " +
        "changed by hand when the default palette changes.",
    );
  }
});

test("the global error screen carries no colour from another palette", () => {
  const source = readFileSync("src/app/global-error.tsx", "utf8").toLowerCase();
  const mine = new Set(
    [
      PALETTES[DEFAULT_PALETTE].light.background,
      PALETTES[DEFAULT_PALETTE].light.foreground,
      PALETTES[DEFAULT_PALETTE].dark.background,
      PALETTES[DEFAULT_PALETTE].dark.foreground,
    ].map((c) => c.toLowerCase()),
  );
  for (const id of PALETTE_IDS) {
    if (id === DEFAULT_PALETTE) continue;
    for (const mode of MODES) {
      for (const role of ["background", "foreground"] as const) {
        const value = PALETTES[id][mode][role].toLowerCase();
        if (mine.has(value)) continue;
        assert.ok(
          !source.includes(value),
          `global-error.tsx uses ${id}/${mode} ${role} (${value}); it must show ` +
            `the default palette (${DEFAULT_PALETTE}), since it is also what the ` +
            "manifest and the launch images use",
        );
      }
    }
  }
});

/* ---------- the init script ---------- */

test("the palette init script falls back to the default and never throws", () => {
  for (const stored of [null, "quiz", "mint", "tiers", "bogus", ""]) {
    const html: { attr: string | null } = { attr: null };
    const fn = new Function(
      "localStorage",
      "document",
      PALETTE_INIT_SCRIPT,
    ) as (ls: unknown, doc: unknown) => void;
    fn(
      { getItem: () => stored },
      { documentElement: { setAttribute: (_: string, v: string) => (html.attr = v) } },
    );
    const expected = isPaletteId(stored) ? stored : DEFAULT_PALETTE;
    assert.equal(html.attr, expected, `stored '${stored}' should resolve to '${expected}'`);
  }
});

test("the palette init script survives localStorage throwing", () => {
  const html: { attr: string | null } = { attr: null };
  const fn = new Function("localStorage", "document", PALETTE_INIT_SCRIPT) as (
    ls: unknown,
    doc: unknown,
  ) => void;
  fn(
    {
      getItem() {
        throw new Error("private mode");
      },
    },
    { documentElement: { setAttribute: (_: string, v: string) => (html.attr = v) } },
  );
  assert.equal(html.attr, DEFAULT_PALETTE);
});
