import assert from "node:assert/strict";
import { test } from "node:test";
import { getTrackQuestions } from "@/content/registry";
import { DOMAIN_NAMES, domainVisual } from "./domain-visual";

/**
 * The domain names are routed on, so they have to match the bank exactly.
 *
 * `domainVisual` falls back rather than throwing, which is right for a color —
 * a surface with the wrong tint is better than a surface that crashes. But the
 * home page now builds links from these same strings, and there the same
 * silence is a dead end: `?domain=Governing%20AI%20Developement` deals an empty
 * session and reports nothing. Nothing else in the app would notice, because
 * the fallback is a legitimate value.
 *
 * These assertions are the only place that difference is caught.
 */

const bankDomains = [...new Set(getTrackQuestions().map((q) => q.domain))].sort();

test("every domain in the bank has its own visual, not the fallback", () => {
  const fallbackShort = domainVisual("a name no domain has").short;
  for (const domain of bankDomains) {
    const v = domainVisual(domain);
    assert.notEqual(
      v.short,
      fallbackShort,
      `"${domain}" is not in domain-visual's table — it is rendering the fallback`,
    );
  }
});

test("DOMAIN_NAMES is exactly the set of domains the bank uses", () => {
  // A name here that the bank does not use would render a control that deals
  // nothing; a bank domain missing here would be unreachable from the home
  // page. Both directions matter, so this compares the sets rather than
  // checking membership one way.
  assert.deepEqual(
    [...DOMAIN_NAMES].sort(),
    bankDomains,
    "DOMAIN_NAMES has drifted from the question bank",
  );
});

test("every domain offers a short label that fits a control", () => {
  for (const domain of DOMAIN_NAMES) {
    const { short } = domainVisual(domain);
    assert.ok(short.length > 0, `${domain} has no short label`);
    assert.ok(
      short.length <= 20,
      `${domain} has a short label of ${short.length} characters, which will wrap on a button`,
    );
  }
});

test("the roman indices are the four blueprint domains, in order", () => {
  assert.deepEqual(
    DOMAIN_NAMES.map((d) => domainVisual(d).roman),
    ["I", "II", "III", "IV"],
  );
});
