import assert from "node:assert/strict";
import { test } from "node:test";
import { getTrackQuestions } from "./registry";
import { DEFAULT_MAINTENANCE, JURISDICTIONS, type Jurisdiction } from "./types";

/**
 * The maintenance layer exists because the bank had no per-item freshness
 * signal: `createdDate` and `updatedDate` are two module-level constants
 * applied identically to all 296 questions, which is a statement about the
 * bank's vintage and no use at all for "when did someone last check this item
 * against the law it cites?".
 *
 * These assertions are mostly about what the layer must NOT do. It must not
 * invent a review that did not happen, and it must not let a status exist
 * without the date that would make it checkable. `scripts/check-content.ts`
 * enforces the same invariants over the real bank at gate time; this covers
 * the normalization that produces them.
 */

const QS = getTrackQuestions("aigp-preparation");

test("every question carries a maintenance block after normalization", () => {
  // Absent in the enrichment entry must become an explicit "unreviewed",
  // not undefined — the app has to be able to count unreviewed items.
  for (const q of QS) {
    assert.ok(q.maintenance, `${q.id} has no maintenance block`);
  }
});

test("a review claim is complete, and nothing else claims one", () => {
  // This assertion used to pin the reviewed count at zero, with a comment
  // saying it should only ever be updated because real reviews happened.
  // They have: the items added when the bank reached outside its original
  // four framework sources were each written against a cited instrument and
  // carry that date.
  //
  // Pinning the count again would just make the next genuine review a test
  // failure. What actually needs protecting is the thing the zero was
  // standing in for — that no item can look maintained without the whole
  // record behind it, and that an unreviewed item says so plainly rather
  // than going quiet.
  for (const q of QS) {
    const m = q.maintenance;
    if (m.lastReviewed === null) {
      assert.deepEqual(
        m,
        DEFAULT_MAINTENANCE,
        `${q.id}: no review date, but the rest of the block is not the honest default`,
      );
      continue;
    }
    assert.notEqual(m.reviewStatus, "unreviewed", `${q.id}: review date with no finding`);
    assert.notEqual(m.freshness, "unreviewed", `${q.id}: review date with no freshness judgment`);
    assert.ok(m.jurisdictions.length > 0, `${q.id}: reviewed but no jurisdiction recorded`);
  }
});

test("a status is never asserted without the date that makes it checkable", () => {
  // The central integrity rule, restated here so it holds even if the gate
  // script is edited: a claim of currency with no date is unfalsifiable.
  for (const q of QS) {
    const { lastReviewed, reviewStatus, freshness } = q.maintenance;
    if (lastReviewed === null) {
      assert.equal(reviewStatus, "unreviewed", `${q.id}: status without a date`);
      assert.equal(freshness, "unreviewed", `${q.id}: freshness without a review`);
    }
  }
});

test("jurisdictions stay inside the controlled vocabulary", () => {
  for (const q of QS) {
    for (const j of q.maintenance.jurisdictions) {
      assert.ok(
        (JURISDICTIONS as readonly Jurisdiction[]).includes(j),
        `${q.id}: unknown jurisdiction "${j}"`,
      );
    }
  }
});

test("sources are always structured, never a bare string", () => {
  // 296 entries author their sources as plain strings. Normalization widens
  // them so no consumer branches on which form the author happened to use —
  // the failure that would otherwise show up as "[object Object]" in the
  // "Check it against" list.
  for (const q of QS) {
    for (const s of q.sources ?? []) {
      assert.equal(typeof s, "object", `${q.id}: source not widened`);
      assert.equal(typeof s.cite, "string");
      assert.ok(s.cite.length > 0, `${q.id}: empty citation`);
    }
  }
});

test("a recorded source URL is absolute https or absent", () => {
  // A relative or http:// link in "Check it against" either goes nowhere or
  // downgrades the connection, and either way reads as a verified citation
  // that was not verified.
  for (const q of QS) {
    for (const s of q.sources ?? []) {
      if (s.url !== undefined) {
        assert.match(s.url, /^https:\/\/\S+$/, `${q.id}: bad source url "${s.url}"`);
      }
    }
  }
});

test("the bank still has a source on every question", () => {
  // Widening the shape must not have dropped any.
  const without = QS.filter((q) => !q.sources?.length);
  assert.equal(without.length, 0, `${without.length} questions lost their sources`);
});
