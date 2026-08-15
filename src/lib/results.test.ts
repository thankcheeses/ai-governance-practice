import assert from "node:assert/strict";
import test from "node:test";
import { getQuestion } from "@/content/registry";
import { getTrackQuestions } from "@/content/registry";
import {
  ACTIVE_SESSION_VERSION,
  type ActiveSession,
  resumeActiveSession,
  validateActiveSession,
  writeActiveSession,
} from "./active-session";
import {
  createExamSession,
  resultFromExam,
  submitExam,
  submitIfExpired,
} from "./exam";
import {
  type CompletedResult,
  elapsedMs,
  formatDuration,
  scoreSitting,
  timeRemainingAtFinish,
  weakestSubdomains,
} from "./results";
import {
  RESULTS_KEY,
  clearResult,
  readResult,
  readResults,
  validateResult,
  writeResult,
} from "./results-storage";
import { emailBody, isValidEmail, sendResultByEmail } from "./results-email";
import { resultPdfBytes, resultPdfFilename, resultReportLines } from "./results-pdf";
import { buildSitting, resultFromActiveSession, sittingComposition } from "./session";
import type { UserProgress } from "./types";

/*
  What these tests are for.

  A result is the one artefact in the product that outlives the thing that
  produced it: the sitting is cleared, the tab is closed, and the report is
  still supposed to be there. The failure that motivated this module was
  exactly that — a completed practice sitting existed only in React state, so a
  refresh on the summary screen destroyed it and dealt a fresh sitting in its
  place. So the tests below care most about survival and about faithfulness:
  the numbers on a restored result must be the numbers that were earned.
*/

const TRACK = "aigp-preparation" as const;
const ALL = getTrackQuestions(TRACK);

function emptyProgress(): UserProgress {
  return {
    trackId: TRACK,
    onboardingCompletedAt: null,
    disclaimerAckedAt: null,
    dailyGoal: 0,
    streak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    attempts: [],
    reviewCards: {},
    updatedAt: new Date().toISOString(),
  };
}

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    get size() {
      return map.size;
    },
    raw: map,
  };
}

/** A finished practice sitting with `correctCount` of its answers right. */
function practiceResult(correctCount = 3, seed = 9001, count = 6) {
  const sitting = buildSitting(emptyProgress(), { seed, count, trackId: TRACK });
  const { questionIds, optionIds } = sittingComposition(sitting);
  const answers: Record<string, string[]> = {};
  questionIds.forEach((id, i) => {
    const question = getQuestion(id)!;
    answers[id] =
      i < correctCount
        ? [...question.correctOptionIds]
        : // A wrong answer that is still a real option on that question.
          [
            question.options.find((o) => !question.correctOptionIds.includes(o.id))!
              .id,
          ];
  });
  const snapshot: ActiveSession = {
    version: 2,
    seed,
    trackId: TRACK,
    mode: "practice",
    label: "Mixed practice",
    withScheduling: false,
    exitHref: "/study",
    questionIds,
    optionIds,
    index: count - 1,
    selected: [],
    revealed: true,
    confidence: null,
    answers,
    correctCount,
    queuedCount: 0,
    startedAt: new Date("2026-01-01T10:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-01-01T10:12:30.000Z").toISOString(),
  };
  return resultFromActiveSession(snapshot, "2026-01-01T10:12:30.000Z");
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

test("a result scores to the answers it stored", () => {
  const result = practiceResult(4, 4321, 6);
  const score = scoreSitting(result);
  assert.equal(score.total, 6);
  assert.equal(score.correct, 4);
  assert.equal(score.incorrect, 2);
  assert.equal(score.unanswered, 0);
  assert.equal(score.percentage, 67);
});

test("an unanswered question counts against the score, not out of it", () => {
  const result = practiceResult(3, 4321, 6);
  const blanked: CompletedResult = {
    ...result,
    answers: Object.fromEntries(
      Object.entries(result.answers).filter(([, v], i) => i < 5 && v),
    ),
  };
  const score = scoreSitting(blanked);
  assert.equal(score.total, 6, "the denominator is every question");
  assert.equal(score.unanswered, 1);
  assert.equal(score.correct + score.incorrect + score.unanswered, 6);
});

test("domain and sub-domain slices account for every scored question", () => {
  const result = practiceResult(3, 777, 10);
  const score = scoreSitting(result);
  const subTotal = score.bySubdomain.reduce((n, s) => n + s.total, 0);
  assert.equal(subTotal, score.total);
  for (const slice of [...score.byDomain, ...score.bySubdomain]) {
    assert.ok(slice.correct <= slice.total);
    assert.equal(slice.accuracy, Math.round((slice.correct / slice.total) * 100));
  }
});

test("weakest sub-domains ignore slices too small to mean anything", () => {
  const result = practiceResult(2, 555, 12);
  const score = scoreSitting(result);
  for (const slice of weakestSubdomains(score)) {
    assert.ok(slice.total >= 2, `${slice.key} has only ${slice.total}`);
  }
});

test("scoring is derived, so it never disagrees with the questions", () => {
  // The record stores choices, not verdicts. Re-scoring the same record twice
  // must agree, and must agree with grading each question directly.
  const result = practiceResult(4, 2468, 8);
  const a = scoreSitting(result);
  const b = scoreSitting(result);
  assert.deepEqual(a, b);
  let expected = 0;
  for (const id of result.questionIds) {
    const question = getQuestion(id)!;
    const chosen = result.answers[id] ?? [];
    const right =
      chosen.length === question.correctOptionIds.length &&
      question.correctOptionIds.every((c) => chosen.includes(c));
    if (right) expected += 1;
  }
  assert.equal(a.correct, expected);
});

/* ------------------------------------------------------------------ */
/* Time                                                                */
/* ------------------------------------------------------------------ */

test("elapsed time is measured between the stored instants", () => {
  const result = practiceResult();
  assert.equal(elapsedMs(result), 12 * 60_000 + 30_000);
  assert.equal(formatDuration(elapsedMs(result)), "12m 30s");
});

test("practice has no time remaining, because it has no allowance", () => {
  assert.equal(timeRemainingAtFinish(practiceResult()), null);
});

test("an exam reports the time it had left when it closed", () => {
  const start = Date.UTC(2026, 0, 1, 9, 0, 0);
  const session = createExamSession({
    seed: 11,
    count: 5,
    durationMs: 60 * 60_000,
    trackId: TRACK,
    now: start,
  });
  const submitted = submitExam(session, "manual", start + 20 * 60_000);
  const result = resultFromExam(submitted)!;
  assert.equal(elapsedMs(result), 20 * 60_000);
  assert.equal(timeRemainingAtFinish(result), 40 * 60_000);
  assert.equal(formatDuration(timeRemainingAtFinish(result)!), "40m 00s");
});

test("an expired exam reports no time remaining rather than a negative", () => {
  const start = Date.UTC(2026, 0, 1, 9, 0, 0);
  const session = createExamSession({
    seed: 12,
    count: 5,
    durationMs: 60 * 60_000,
    trackId: TRACK,
    now: start,
  });
  // Closed well after the deadline, as an unattended tab would be.
  const submitted = submitIfExpired(session, start + 90 * 60_000);
  const result = resultFromExam(submitted)!;
  assert.equal(result.reason, "expired");
  assert.equal(timeRemainingAtFinish(result), 0);
});

test("formatDuration drops units that are zero from the left", () => {
  assert.equal(formatDuration(0), "0s");
  assert.equal(formatDuration(9_000), "9s");
  assert.equal(formatDuration(65_000), "1m 05s");
  assert.equal(formatDuration(3_725_000), "1h 02m 05s");
});

/* ------------------------------------------------------------------ */
/* Persistence — the bug this module exists for                        */
/* ------------------------------------------------------------------ */

test("a completed practice result survives a round trip through storage", () => {
  const storage = memoryStorage();
  const result = practiceResult(4, 8642, 6);
  writeResult(result, storage);
  const back = readResult("practice", storage);
  assert.ok(back, "the result came back");
  assert.deepEqual(back, result);
});

test("a restored result scores identically to the one that was stored", () => {
  const storage = memoryStorage();
  const result = practiceResult(5, 1357, 9);
  writeResult(result, storage);
  assert.deepEqual(
    scoreSitting(readResult("practice", storage)!),
    scoreSitting(result),
  );
});

test("question order and option order come back exactly as they were", () => {
  const storage = memoryStorage();
  const result = practiceResult(2, 2244, 7);
  writeResult(result, storage);
  const back = readResult("practice", storage)!;
  assert.deepEqual(back.questionIds, result.questionIds);
  assert.deepEqual(back.optionIds, result.optionIds);
});

test("practice and exam results occupy separate slots and do not evict each other", () => {
  const storage = memoryStorage();
  const practice = practiceResult(3, 31, 5);
  const exam = resultFromExam(
    submitExam(
      createExamSession({ seed: 32, count: 5, trackId: TRACK, now: 1_000 }),
      "manual",
      2_000,
    ),
  )!;

  writeResult(practice, storage);
  writeResult(exam, storage);

  const both = readResults(storage);
  assert.ok(both.practice, "practice survived writing an exam result");
  assert.ok(both.exam);
  assert.equal(both.practice!.sittingId, practice.sittingId);
  assert.equal(both.exam!.mode, "exam");
});

test("clearing one mode leaves the other intact", () => {
  const storage = memoryStorage();
  writeResult(practiceResult(1, 41, 4), storage);
  writeResult(
    resultFromExam(
      submitExam(
        createExamSession({ seed: 42, count: 4, trackId: TRACK, now: 1_000 }),
        "manual",
        2_000,
      ),
    )!,
    storage,
  );
  clearResult("exam", storage);
  assert.ok(readResult("practice", storage));
  assert.equal(readResult("exam", storage), null);
});

test("an exam result is only produced once the exam has closed", () => {
  const open = createExamSession({ seed: 51, count: 5, trackId: TRACK, now: 1_000 });
  assert.equal(resultFromExam(open), null, "an exam in progress has no result");
  assert.ok(resultFromExam(submitExam(open, "manual", 2_000)));
});

test("an exam result records why the exam closed", () => {
  const start = 1_000;
  const session = createExamSession({
    seed: 52,
    count: 5,
    durationMs: 1_000,
    trackId: TRACK,
    now: start,
  });
  assert.equal(resultFromExam(submitExam(session, "manual", start + 500))!.reason, "manual");
  assert.equal(
    resultFromExam(submitIfExpired(session, start + 5_000))!.reason,
    "expired",
  );
});

/* ------------------------------------------------------------------ */
/* Corrupt and tampered state                                          */
/* ------------------------------------------------------------------ */

test("unparseable stored text is discarded rather than re-read forever", () => {
  const storage = memoryStorage();
  storage.setItem(RESULTS_KEY, "{not json");
  assert.deepEqual(readResults(storage), {});
  assert.equal(storage.getItem(RESULTS_KEY), null, "the slot was cleared");
});

test("a stored result whose questions have left the bank is rejected", () => {
  const result = practiceResult(2, 61, 5);
  assert.equal(
    validateResult({ ...result, questionIds: ["aigp-does-not-exist", ...result.questionIds.slice(1)] }),
    null,
  );
});

test("a result claiming an answer to a question it does not contain is rejected", () => {
  const result = practiceResult(2, 62, 5);
  const foreign = ALL.find((q) => !result.questionIds.includes(q.id))!;
  assert.equal(
    validateResult({
      ...result,
      answers: { ...result.answers, [foreign.id]: [foreign.options[0].id] },
    }),
    null,
  );
});

test("a result whose answer points at another question's option is rejected", () => {
  const result = practiceResult(2, 63, 5);
  const mine = result.questionIds[0];
  const foreign = ALL.find((q) => !result.questionIds.includes(q.id))!;
  assert.equal(
    validateResult({
      ...result,
      answers: { ...result.answers, [mine]: [foreign.options[0].id] },
    }),
    null,
  );
});

test("an option row that is not a permutation of its question is rejected", () => {
  const result = practiceResult(2, 64, 5);
  const rows = result.optionIds.map((r) => [...r]);
  rows[0] = [rows[0][0], rows[0][0], ...rows[0].slice(2)];
  assert.equal(validateResult({ ...result, optionIds: rows }), null);
});

test("a result that finished before it started is rejected", () => {
  const result = practiceResult(2, 65, 5);
  assert.equal(
    validateResult({ ...result, completedAt: "2020-01-01T00:00:00.000Z" }),
    null,
  );
});

test("a practice result claiming a deadline is rejected", () => {
  // durationMs and deadline travel together and belong to exams only. A
  // practice result carrying one would report a time limit it never had.
  const result = practiceResult(2, 66, 5);
  assert.equal(
    validateResult({ ...result, deadline: new Date().toISOString() }),
    null,
  );
  assert.equal(validateResult({ ...result, durationMs: 3_600_000 }), null);
});

test("a stale result version is discarded rather than migrated", () => {
  const result = practiceResult(2, 67, 5);
  assert.equal(validateResult({ ...result, version: 0 }), null);
  assert.equal(validateResult({ ...result, version: 2 }), null);
});

test("a result with an unknown mode or reason is rejected", () => {
  const result = practiceResult(2, 68, 5);
  assert.equal(validateResult({ ...result, mode: "quiz" }), null);
  assert.equal(validateResult({ ...result, reason: "abandoned" }), null);
});

/* ------------------------------------------------------------------ */
/* Separation from the in-flight practice sitting                      */
/* ------------------------------------------------------------------ */

test("results are stored under their own key, not the practice sitting's", () => {
  const storage = memoryStorage();
  writeResult(practiceResult(2, 71, 5), storage);
  assert.deepEqual([...storage.raw.keys()], [RESULTS_KEY]);
  assert.ok(!RESULTS_KEY.includes("active-session"));
  assert.ok(!RESULTS_KEY.includes("progress"));
  assert.ok(!RESULTS_KEY.includes("exam-session"));
});

test("an in-flight sitting now carries the answers a result is built from", () => {
  // v1 threw the choices away as the learner advanced, which is why a finished
  // sitting could not be reported after a refresh.
  const sitting = buildSitting(emptyProgress(), { seed: 72, count: 4, trackId: TRACK });
  const { questionIds, optionIds } = sittingComposition(sitting);
  const question = getQuestion(questionIds[0])!;
  const snapshot = {
    version: 2,
    seed: 72,
    trackId: TRACK,
    mode: "practice" as const,
    label: "Mixed practice",
    withScheduling: false,
    exitHref: "/study",
    questionIds,
    optionIds,
    index: 1,
    selected: [],
    revealed: false,
    confidence: null,
    answers: { [question.id]: [...question.correctOptionIds] },
    correctCount: 1,
    queuedCount: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const valid = validateActiveSession(snapshot);
  assert.ok(valid, "a v2 snapshot with answers validates");
  assert.deepEqual(valid.answers[question.id], question.correctOptionIds);
});

test("a sitting whose stored answer belongs to another question is rejected", () => {
  const sitting = buildSitting(emptyProgress(), { seed: 73, count: 4, trackId: TRACK });
  const { questionIds, optionIds } = sittingComposition(sitting);
  const foreign = ALL.find((q) => !questionIds.includes(q.id))!;
  const snapshot = {
    version: 2,
    seed: 73,
    trackId: TRACK,
    mode: "practice" as const,
    label: "Mixed practice",
    withScheduling: false,
    exitHref: "/study",
    questionIds,
    optionIds,
    index: 0,
    selected: [],
    revealed: false,
    confidence: null,
    answers: { [foreign.id]: [foreign.options[0].id] },
    correctCount: 0,
    queuedCount: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.equal(validateActiveSession(snapshot), null);
});

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

test("the PDF is a structurally valid document", () => {
  const bytes = resultPdfBytes(practiceResult(3, 81, 8));
  const text = Buffer.from(bytes).toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"), "starts with a PDF header");
  assert.ok(text.trimEnd().endsWith("%%EOF"), "ends with the EOF marker");
  assert.ok(text.includes("/Type /Catalog"));
  assert.ok(text.includes("/Type /Pages"));
  assert.ok(text.includes("/BaseFont /Courier"));
  assert.ok(/startxref\n\d+/.test(text));
});

test("the PDF cross-reference table points at the objects it claims to", () => {
  // The one thing a hand-written PDF gets wrong is byte offsets, and a reader
  // that cannot follow them shows a blank document rather than an error.
  const bytes = resultPdfBytes(practiceResult(3, 82, 6));
  const text = Buffer.from(bytes).toString("latin1");
  const xrefAt = Number(/startxref\n(\d+)/.exec(text)![1]);
  assert.equal(text.slice(xrefAt, xrefAt + 4), "xref", "startxref lands on the table");

  const rows = text
    .slice(xrefAt)
    .split("\n")
    .filter((l) => /^\d{10} \d{5} n\s*$/.test(l));
  assert.ok(rows.length >= 5, `only ${rows.length} object rows`);
  rows.forEach((row, i) => {
    const offset = Number(row.slice(0, 10));
    assert.ok(
      text.startsWith(`${i + 1} 0 obj`, offset),
      `object ${i + 1} is not at offset ${offset}`,
    );
  });
});

test("the PDF reports the same numbers as the result", () => {
  const result = practiceResult(5, 83, 8);
  const score = scoreSitting(result);
  const body = resultReportLines(result)
    .lines.map((l) => l.text)
    .join("\n");
  assert.ok(body.includes(`${score.correct} / ${score.total}`), "score line");
  assert.ok(body.includes(`(${score.percentage}%)`), "percentage");
  assert.ok(body.includes(`Time used       ${formatDuration(elapsedMs(result))}`));
  assert.ok(body.includes("DOMAIN PERFORMANCE"));
  assert.ok(body.includes("SUB-DOMAIN PERFORMANCE"));
});

test("breakdown rows stay on the grid instead of reflowing", () => {
  // A row longer than the column gets word-wrapped, which collapses the runs
  // of spaces holding the columns apart and leaves the bars ragged down the
  // page. The variable-length label is clipped so that cannot happen.
  const lines = resultReportLines(practiceResult(4, 89, 20)).lines.map((l) => l.text);
  const rows = lines.filter((l) => /\[[#.]+\]/.test(l));
  assert.ok(rows.length >= 4, `only ${rows.length} breakdown rows`);
  const barColumns = new Set(rows.map((r) => r.indexOf("[")));
  // Domain rows and sub-domain rows use different prefix widths, so two
  // positions are expected — but never one per row.
  assert.ok(
    barColumns.size <= 2,
    `bars start at ${barColumns.size} different columns: ${[...barColumns].join(", ")}`,
  );
});

test("the PDF states what it is and claims nothing about a real exam", () => {
  const body = resultReportLines(practiceResult(3, 84, 6))
    .lines.map((l) => l.text)
    .join(" ");
  assert.ok(/Practice simulation/i.test(body));
  assert.ok(/not affiliated/i.test(body));
  assert.ok(/predicts no certification result/i.test(body));
  for (const claim of [
    /predicted score/i,
    /you (are|will be) ready/i,
    /pass(ing)? (score|mark|likelihood)/i,
    /real exam/i,
    /actual exam questions/i,
  ]) {
    assert.ok(!claim.test(body), `PDF makes a prohibited claim: ${claim}`);
  }
});

test("an exam PDF reports the clock; a practice PDF has no clock to report", () => {
  const exam = resultFromExam(
    submitExam(
      createExamSession({
        seed: 85,
        count: 5,
        durationMs: 3_600_000,
        trackId: TRACK,
        now: 0,
      }),
      "manual",
      600_000,
    ),
  )!;
  const examBody = resultReportLines(exam).lines.map((l) => l.text).join("\n");
  assert.ok(examBody.includes("Time remaining"), "exam shows what was left");

  const practiceBody = resultReportLines(practiceResult())
    .lines.map((l) => l.text)
    .join("\n");
  assert.ok(!practiceBody.includes("Time remaining"));
  assert.ok(practiceBody.includes("Time used"));
});

test("the PDF paginates rather than writing off the bottom of one page", () => {
  const bytes = resultPdfBytes(practiceResult(1, 86, 40));
  const text = Buffer.from(bytes).toString("latin1");
  const pages = (text.match(/\/Type \/Page[^s]/g) ?? []).length;
  assert.ok(pages >= 2, `a 40-question report produced ${pages} page(s)`);
  assert.ok(text.includes(`/Count ${pages}`), "the page tree counts them all");
});

test("every byte written is single-byte, so the offsets stay true", () => {
  const bytes = resultPdfBytes(practiceResult(3, 87, 10));
  for (const b of bytes) assert.ok(b <= 0xff);
  const text = Buffer.from(bytes).toString("latin1");
  // The bank is written with en dashes and curly quotes; they must have been
  // folded rather than emitted as multi-byte sequences.
  assert.ok(!/[‐-⹿]/.test(text));
});

test("the filename names the mode and the date", () => {
  const name = resultPdfFilename(practiceResult(2, 88, 5));
  assert.equal(name, "aigp-practice-results-2026-01-01.pdf");
  assert.ok(name.endsWith(".pdf"));
});

/* ------------------------------------------------------------------ */
/* Email                                                               */
/* ------------------------------------------------------------------ */

test("obvious typos are caught and ordinary addresses are not", () => {
  for (const good of ["a@b.co", "first.last@example.com", "x+tag@sub.domain.org"]) {
    assert.ok(isValidEmail(good), good);
  }
  for (const bad of ["", "nope", "no@domain", "two@@at.com", "sp ace@x.com", "@x.com"]) {
    assert.ok(!isValidEmail(bad), bad);
  }
});

test("nothing is sent when no delivery endpoint is configured", async () => {
  let called = false;
  const outcome = await sendResultByEmail(practiceResult(), "a@b.co", {
    endpoint: null,
    fetch: (async () => {
      called = true;
      return new Response("", { status: 200 });
    }) as unknown as typeof fetch,
  });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.ok === false && outcome.reason, "unconfigured");
  assert.equal(called, false, "an unconfigured build must not make a request");
});

test("an invalid address is refused before any request is made", async () => {
  let called = false;
  const outcome = await sendResultByEmail(practiceResult(), "not-an-address", {
    endpoint: "https://example.invalid/send",
    key: "k",
    fetch: (async () => {
      called = true;
      return new Response("", { status: 200 });
    }) as unknown as typeof fetch,
  });
  assert.equal(outcome.ok === false && outcome.reason, "invalid-email");
  assert.equal(called, false);
});

test("a failed delivery reports failure instead of throwing or claiming success", async () => {
  const rejected = await sendResultByEmail(practiceResult(), "a@b.co", {
    endpoint: "https://example.invalid/send",
    key: "k",
    fetch: (async () => new Response("", { status: 500 })) as unknown as typeof fetch,
  });
  assert.equal(rejected.ok, false);

  const threw = await sendResultByEmail(practiceResult(), "a@b.co", {
    endpoint: "https://example.invalid/send",
    key: "k",
    fetch: (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch,
  });
  assert.equal(threw.ok, false);
  assert.equal(threw.ok === false && threw.reason, "failed");
  assert.ok(
    threw.ok === false && !/a@b\.co/.test(threw.message),
    "a failure message must not quote the address",
  );
});

test("a successful send posts the address once and reports success", async () => {
  const seen: { url: string; body: string }[] = [];
  const outcome = await sendResultByEmail(practiceResult(4, 91, 6), "me@example.com", {
    endpoint: "https://example.invalid/send",
    key: "k",
    fetch: (async (url: string, init: RequestInit) => {
      seen.push({ url, body: String(init.body) });
      return new Response("", { status: 200 });
    }) as unknown as typeof fetch,
  });
  assert.equal(outcome.ok, true);
  assert.equal(seen.length, 1);
  const payload = JSON.parse(seen[0].body);
  assert.equal(payload.to, "me@example.com");
  assert.equal(payload.summary.correct, 4);
  assert.equal(payload.summary.total, 6);
});

test("the emailed summary carries no answer key", () => {
  const result = practiceResult(2, 92, 8);
  const body = emailBody(result);
  for (const id of result.questionIds) {
    const question = getQuestion(id)!;
    for (const optionId of question.correctOptionIds) {
      const option = question.options.find((o) => o.id === optionId)!;
      assert.ok(
        !body.includes(option.text),
        `the correct option text for ${id} leaked into the email`,
      );
    }
    assert.ok(!body.includes(question.rationale), `a rationale leaked for ${id}`);
  }
});

test("the emailed summary states what it is", () => {
  const body = emailBody(practiceResult(3, 93, 6));
  assert.ok(/practice simulation/i.test(body));
  assert.ok(/not.*certification exam/i.test(body));
  assert.ok(!/predicted/i.test(body));
});

/* ------------------------------------------------------------------ */
/* The writer and the validator must agree                             */
/* ------------------------------------------------------------------ */

test("a snapshot stamped with the exported version validates", () => {
  /*
    This test exists because of a live regression. `ActiveSession` went to v2
    to carry the answers a result is built from, but the study screen kept
    writing `version: 1`. Every snapshot it wrote then failed validation on
    restore, so refreshing mid-sitting silently dealt a brand-new sitting —
    the exact invariant the snapshot exists to protect.

    Every unit test passed throughout, because they all built snapshots by
    hand with the right version and never exercised the writer's shape. So the
    version is now exported and asserted here rather than repeated as a
    literal at each call site.
  */
  const sitting = buildSitting(emptyProgress(), { seed: 4242, count: 5, trackId: TRACK });
  const { questionIds, optionIds } = sittingComposition(sitting);
  const written = {
    version: ACTIVE_SESSION_VERSION,
    seed: 4242,
    trackId: TRACK,
    mode: "practice" as const,
    label: "Mixed practice",
    withScheduling: false,
    exitHref: "/study",
    questionIds,
    optionIds,
    index: 0,
    selected: [],
    revealed: false,
    confidence: null,
    answers: {},
    correctCount: 0,
    queuedCount: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.ok(
    validateActiveSession(written),
    "the shape the study screen writes must survive its own validator",
  );
});

test("a sitting written and read back resumes to the same place", () => {
  // End to end through storage, at the version the writer actually stamps.
  const storage = memoryStorage();
  const seed = 5150;
  const sitting = buildSitting(emptyProgress(), { seed, count: 6, trackId: TRACK });
  const { questionIds, optionIds } = sittingComposition(sitting);
  const question = getQuestion(questionIds[2])!;
  const snapshot = {
    version: ACTIVE_SESSION_VERSION,
    seed,
    trackId: TRACK,
    mode: "practice" as const,
    label: "Mixed practice",
    withScheduling: false,
    exitHref: "/study",
    questionIds,
    optionIds,
    index: 2,
    selected: [question.options[1].id],
    revealed: false,
    confidence: null,
    answers: {},
    correctCount: 1,
    queuedCount: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeActiveSession(snapshot, storage);

  const resumed = resumeActiveSession({ mode: "practice", seed }, storage);
  assert.ok(resumed, "the stored sitting was not resumable");
  assert.equal(resumed.index, 2, "position was lost");
  assert.deepEqual(resumed.questionIds, questionIds, "the paper changed");
  assert.deepEqual(resumed.optionIds, optionIds, "the options were re-dealt");
  assert.deepEqual(resumed.selected, [question.options[1].id], "the answer was lost");
});


/* ------------------------------------------------------------------ */
/* The endpoint's authorization contract                               */
/* ------------------------------------------------------------------ */

test("the request carries a bearer, because the gateway rejects it otherwise", async () => {
  /*
    The reported failure was `Sending failed (401)`. The cause was that this
    request went out with only a content-type header: Supabase Edge Functions
    deploy with `verify_jwt = true`, and the gateway rejects an unauthenticated
    call before the function body runs — so the mail provider's key was never
    read and the 401 had nothing to do with it.
  */
  let seen: Record<string, string> = {};
  await sendResultByEmail(practiceResult(), "a@b.co", {
    endpoint: "https://example.invalid/functions/v1/resend-email",
    key: "test-publishable-key",
    fetch: (async (_url: string, init: RequestInit) => {
      seen = init.headers as Record<string, string>;
      return new Response("", { status: 200 });
    }) as unknown as typeof fetch,
  });
  assert.equal(
    seen.authorization,
    "Bearer test-publishable-key",
    "no bearer means a 401 from the gateway",
  );
  assert.equal(seen.apikey, "test-publishable-key");
  assert.equal(seen["content-type"], "application/json");
});

test("nothing is sent when the endpoint is configured but the key is not", async () => {
  let called = false;
  const outcome = await sendResultByEmail(practiceResult(), "a@b.co", {
    endpoint: "https://example.invalid/functions/v1/resend-email",
    key: null,
    fetch: (async () => {
      called = true;
      return new Response("", { status: 200 });
    }) as unknown as typeof fetch,
  });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.ok === false && outcome.reason, "unconfigured");
  assert.equal(called, false, "a request with no credential would only 401");
});

/*
  This test used to assert that 401 *and* 403 both named the gateway, which was
  wrong and hid a real failure: an unverified sending domain makes the provider
  return 403, the function passes that status through on purpose, and the user
  was told to go and look at a credential the provider never rejected. The two
  statuses mean different things and must read differently.
*/
test("401 names the gateway; 403 names the mail provider", async () => {
  const send = (status: number, body = "") =>
    sendResultByEmail(practiceResult(), "a@b.co", {
      endpoint: "https://example.invalid/functions/v1/resend-email",
      key: "k",
      fetch: (async () =>
        new Response(body, { status })) as unknown as typeof fetch,
    });

  const gateway = await send(401);
  assert.equal(gateway.ok, false);
  assert.ok(
    gateway.ok === false &&
      /before it reached the mail function/i.test(gateway.message),
    `401 should name the gateway, got: ${gateway.ok === false ? gateway.message : ""}`,
  );

  const provider = await send(403);
  assert.equal(provider.ok, false);
  assert.ok(
    provider.ok === false &&
      /mail provider/i.test(provider.message) &&
      !/before it reached the mail function/i.test(provider.message),
    `403 should name the provider, got: ${provider.ok === false ? provider.message : ""}`,
  );
});

test("the provider's own explanation is surfaced, not swallowed", async () => {
  // The function returns Resend's wording in `detail`; it names the real
  // problem better than anything this layer could infer from a status code.
  const outcome = await sendResultByEmail(practiceResult(), "a@b.co", {
    endpoint: "https://example.invalid/functions/v1/resend-email",
    key: "k",
    fetch: (async () =>
      new Response(
        JSON.stringify({
          error: "The mail provider rejected the message",
          detail: "The example.org domain is not verified.",
        }),
        { status: 403 },
      )) as unknown as typeof fetch,
  });
  assert.ok(
    outcome.ok === false && /domain is not verified/i.test(outcome.message),
    `expected the provider's words, got: ${outcome.ok === false ? outcome.message : ""}`,
  );
});

test("no request is made and no key is needed when the address is invalid", async () => {
  let called = false;
  const outcome = await sendResultByEmail(practiceResult(), "nope", {
    endpoint: "https://example.invalid/functions/v1/resend-email",
    key: "k",
    fetch: (async () => {
      called = true;
      return new Response("", { status: 200 });
    }) as unknown as typeof fetch,
  });
  assert.equal(outcome.ok === false && outcome.reason, "invalid-email");
  assert.equal(called, false);
});
