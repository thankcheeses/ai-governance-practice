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
 * the normalisation that produces them.
 */

const QS = getTrackQuestions("aigp-preparation");

test("every question carries a maintenance block after normalisation", () => {
  // Absent in the enrichment entry must become an explicit "unreviewed",
  // not undefined — the app has to be able to count unreviewed items.
  for (const q of QS) {
    assert.ok(q.maintenance, `${q.id} has no maintenance block`);
  }
});

test("nothing claims to have been reviewed when nothing has been", () => {
  // The honest starting point. This number is meant to go up as items are
  // genuinely re-read; it is not meant to be backfilled to make the bank look
  // maintained. If this assertion is ever updated, it should be because real
  // reviews happened.
  const reviewed = QS.filter((q) => q.maintenance.lastReviewed !== null);
  assert.equal(
    reviewed.length,
    0,
    `${reviewed.length} items claim a review date: ${reviewed.slice(0, 3).map((q) => q.id).join(", ")}`,
  );
  for (const q of QS) {
    assert.deepEqual(q.maintenance, DEFAULT_MAINTENANCE);
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
  // 296 entries author their sources as plain strings. Normalisation widens
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
