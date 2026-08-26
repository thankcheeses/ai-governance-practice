import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * Where the theme-init script sits in the root layout.
 *
 * This is a source-shape test rather than a behavioural one, which is unusual
 * enough to justify. The behaviour it protects can only be measured in a real
 * browser against a production build — the test runner here is
 * `tsx --test "src/**\/*.test.ts"` with no DOM — so the alternative to
 * asserting on the source is asserting nothing at all, and this regressed once
 * already.
 *
 * What it protects, from docs/known-issues.md:
 *
 * 1. The script must not be a child of `<head>`. React 19 reconciles `<head>`
 *    as a set of hoistable resources during hydration; a script rendered into
 *    that set joins the reconciliation, and on a warm reload the browser's head
 *    no longer matches the one React expects. That produced React error #418 on
 *    4/10 reloads of /terms/ and 5/10 of /home/.
 *
 * 2. It must stay a plain inline `<script>`. `next/script` with
 *    `strategy="beforeInteractive"` is the obvious replacement and breaks the
 *    no-flash guarantee: in the App Router it defers execution until the
 *    framework bundle has loaded, which is after first paint.
 *
 * 3. It must be the first thing in `<body>`, ahead of any paintable element,
 *    or a stored dark preference paints light for a frame.
 */
const LAYOUT = "src/app/layout.tsx";
const source = readFileSync(LAYOUT, "utf8");

/** JSX comments carry the reasoning and would otherwise match every pattern. */
const code = source.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

test("1. the layout renders no <script> inside <head>", () => {
  const head = /<head[\s>][\s\S]*?<\/head>/.exec(code)?.[0];
  if (!head) return; // No <head> element at all is the state we want.
  assert.ok(
    !/<script[\s>]/.test(head),
    "a <script> is rendered inside <head>; React 19 reconciles head resources " +
      "during hydration and this reintroduces React error #418 on reload — " +
      "see docs/known-issues.md",
  );
});

test("2. the theme script is a plain inline script, not next/script", () => {
  assert.ok(
    !/from "next\/script"/.test(code),
    "next/script defers past first paint in the App Router, which reintroduces " +
      "the theme flash — see docs/known-issues.md",
  );
  assert.match(
    code,
    /<script dangerouslySetInnerHTML=\{\{ __html: THEME_INIT_SCRIPT \}\} \/>/,
    "the theme-init script must be rendered as an inline <script> so it runs " +
      "synchronously during parsing",
  );
});

test("3. it runs before anything paintable", () => {
  const bodyStart = code.indexOf("<body");
  const marker = code.indexOf("THEME_INIT_SCRIPT }} />");
  assert.ok(bodyStart >= 0, "no <body> element found in the layout");
  assert.ok(marker > bodyStart, "the theme script must be inside <body>");
  // The opening tag of the theme script itself, so it is not counted as an
  // element preceding itself.
  const script = code.lastIndexOf("<script", marker);

  // Nothing renderable may precede it. Component elements are capitalised;
  // intrinsic elements are lowercase. Either would paint.
  const between = code.slice(bodyStart, script);
  const preceding = between.match(/<[A-Za-z][\w.]*[\s/>]/g) ?? [];
  assert.deepEqual(
    preceding.filter((t) => !t.startsWith("<body")),
    [],
    `elements render before the theme script: ${preceding.join(", ")} — ` +
      "a stored dark preference would paint light for a frame",
  );
});
