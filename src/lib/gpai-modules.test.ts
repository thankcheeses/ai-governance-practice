import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * Every GPAI teaching module's diagram has to be its control surface.
 *
 * `module-frame.tsx` states the rule in prose — "the diagram is the control" —
 * and the frame hands each module an `{ active, select }` api to honor it. Four
 * of the five did. `PreLaunchGate` rendered `<GateRail labels={…} />` with no
 * api at all, so its five stages had explanations written, stored, shipped, and
 * unreachable: nothing on that card could select a stage.
 *
 * It was invisible in review because the code reads perfectly well. A diagram
 * prop that ignores its argument looks like a diagram prop. Nothing throws,
 * nothing warns, the card renders, and the only symptom is that clicking does
 * nothing — which you only notice if you try, on a module that was not
 * rendered anywhere to try it on.
 *
 * A source-shape test for the same reason `theme-init-placement.test.ts` is
 * one: the behavior needs a DOM to observe, the runner has none, and the
 * alternative to asserting on the source is asserting nothing.
 */
const MODULES = "src/components/civic/gpai/index.tsx";

test("every module's diagram receives the frame's selection api", () => {
  const source = readFileSync(MODULES, "utf8");

  const diagrams = [...source.matchAll(/diagram=\{([^\n]*)/g)];
  assert.ok(diagrams.length >= 5, `only found ${diagrams.length} diagram props`);

  for (const [, opening] of diagrams) {
    assert.match(
      opening,
      /\(\s*\{[^}]*\bactive\b[^}]*\bselect\b[^}]*\}\s*\)/,
      `a diagram prop ignores the frame's api — it opens with "${opening.trim()}". ` +
        "A diagram that does not take { active, select } cannot be the card's " +
        "control, so its stage explanations are unreachable.",
    );
  }
});

test("every module passes that api down to its diagram component", () => {
  // Destructuring it and then not forwarding it would satisfy the check above
  // while leaving the diagram exactly as inert.
  const source = readFileSync(MODULES, "utf8");

  const bodies = [...source.matchAll(/diagram=\{\(\s*\{[^}]*\}\s*\)\s*=>\s*\(([\s\S]*?)\n\s*\)\}/g)];
  assert.ok(bodies.length >= 5, `only found ${bodies.length} diagram bodies`);

  for (const [, body] of bodies) {
    assert.match(body, /\bactive=\{active\}/, `a diagram never passes active down: ${body.trim().slice(0, 80)}…`);
    assert.match(body, /\bonSelect=\{select\}/, `a diagram never passes select down: ${body.trim().slice(0, 80)}…`);
  }
});

test("every interactive diagram names its control group", () => {
  // `groupLabel` is what a screen reader announces before the stage buttons.
  // Optional in the prop type, because `GateRail` has a legitimate decorative
  // use with no controls to name — which is exactly why it needs asserting
  // here, where the rail is a control.
  const source = readFileSync(MODULES, "utf8");
  const bodies = [...source.matchAll(/diagram=\{\(\s*\{[^}]*\}\s*\)\s*=>\s*\(([\s\S]*?)\n\s*\)\}/g)];

  for (const [, body] of bodies) {
    assert.match(
      body,
      /groupLabel=\{?["'`]/,
      `a diagram's control group is unnamed: ${body.trim().slice(0, 80)}…`,
    );
  }
});

/**
 * The decorative use has to keep working.
 *
 * The home page renders a bare `<GateRail>` as a small illustration beside
 * "Continue practicing". There is no detail panel on that card, so beads that
 * depressed and revealed nothing would be worse than beads that are plainly
 * ornament — this asserts the decorative call site stays decorative, so the
 * interactive version cannot be made mandatory by a later tidy-up.
 */
test("a GateRail with no onSelect stays decoration", () => {
  const diagrams = readFileSync("src/components/civic/gpai/diagrams.tsx", "utf8");
  assert.match(
    diagrams,
    /const interactive = typeof onSelect === "function";/,
    "GateRail no longer decides interactivity from onSelect",
  );
  assert.match(
    diagrams,
    /\{\.\.\.\(interactive\s*\n?\s*\?\s*\{ role: "group", "aria-label": groupLabel \}\s*\n?\s*:\s*\{ "aria-hidden": true \}\)\}/,
    "GateRail no longer hides itself from assistive tech when decorative",
  );
});
