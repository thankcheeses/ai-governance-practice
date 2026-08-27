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
import {
  resultPdfBytes,
  resultPdfFilename,
  resultReportOps,
  resultReportPages,
  resultReportText,
} from "./results-pdf";
import { assessReadiness, gradeFor } from "./readiness";
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
  assert.ok(text.includes("/BaseFont /Helvetica"));
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
  const body = resultReportText(result);
  assert.ok(body.includes(`${score.correct} of ${score.total} correct`), "score line");
  assert.ok(body.includes(`${score.percentage}%`), "percentage");
  assert.ok(body.includes(`Time used: ${formatDuration(elapsedMs(result))}`));
  assert.ok(body.includes("PERFORMANCE OVERVIEW"));
  assert.ok(body.includes("DOMAIN PERFORMANCE"));
});

test("progress bars are drawn geometry, never characters", () => {
  /*
    The defect this replaces: the report used to render every bar as
    `[####......]`, because the generator emitted text operators and no path
    operators at all. A bar made of characters is the failure, so this checks
    both halves — that no run of hashes survives anywhere in the text, and that
    real filled rectangles exist to have replaced them.
  */
  const ops = resultReportOps(practiceResult(4, 89, 20));

  const texts = ops.filter((op) => op.kind === "text").map((op) => op.text);
  for (const t of texts) {
    assert.ok(!/#{3,}/.test(t), `a text bar survived: ${t}`);
    assert.ok(!/[\u2588\u2591\u2592\u2593\u25A0]/.test(t), `a block glyph survived: ${t}`);
  }

  const tracks = ops.filter((op) => op.tag === "bar-track");
  const fills = ops.filter((op) => op.tag === "bar-fill");
  assert.ok(tracks.length >= 6, `only ${tracks.length} bar tracks drawn`);
  assert.ok(fills.length >= 1, "no bar was filled");
  for (const op of [...tracks, ...fills]) {
    assert.equal(op.kind, "rect", "a bar is not a rectangle");
    assert.ok(op.kind === "rect" && op.fill, "a bar has no fill colour");
  }
});

test("a bar's filled width is proportional to the value it reports", () => {
  // Overall accuracy is the first bar drawn, and its track spans the column.
  const result = practiceResult(6, 91, 10);
  const score = scoreSitting(result);
  const ops = resultReportOps(result);
  const track = ops.find((op) => op.tag === "bar-track");
  const fill = ops.find((op) => op.tag === "bar-fill");
  assert.ok(track?.kind === "rect" && fill?.kind === "rect");
  if (track?.kind !== "rect" || fill?.kind !== "rect") return;

  const ratio = fill.w / track.w;
  assert.ok(
    Math.abs(ratio * 100 - score.percentage) <= 1.5,
    `bar shows ${(ratio * 100).toFixed(1)}% for a score of ${score.percentage}%`,
  );
});

test("nothing on the report is carried by colour alone", () => {
  // Every bar reinforces a number that is also written out. If a bar were the
  // only carrier of a value, a monochrome printout would lose it.
  const result = practiceResult(4, 92, 12);
  const score = scoreSitting(result);
  const body = resultReportText(result);
  for (const d of score.byDomain) {
    assert.ok(
      body.includes(`${d.correct} correct of ${d.total}`),
      `domain ${d.roman} has no written counts beside its bar`,
    );
  }
  assert.ok(body.includes("Bank coverage this sitting"));
});

test("the PDF states what it is and claims nothing about a real exam", () => {
  const body = resultReportText(practiceResult(3, 84, 6));
  assert.ok(/Independent educational product/i.test(body));
  assert.ok(/not affiliated/i.test(body));
  assert.ok(/not an examination prediction/i.test(body));
  assert.ok(/one practice tool among several/i.test(body));
  for (const claim of [
    /predicted score/i,
    /you (are|will be) ready/i,
    /you will pass/i,
    /pass(ing)? (score|mark|likelihood|probability)/i,
    /actual exam questions/i,
  ]) {
    assert.ok(!claim.test(body), `PDF makes a prohibited claim: ${claim}`);
  }

  /*
    "Guarantee" is allowed to appear, but only in the negative. The approved
    disclaimer says the product "does not guarantee exam success", so a blanket
    ban would fail on the very sentence that protects the reader. What must
    never appear is an unqualified one, so every sentence containing the word is
    checked for a negation rather than the word being forbidden outright.
  */
  for (const sentence of body.match(/[^.\n]*\bguarantee\w*[^.\n]*/gi) ?? []) {
    assert.ok(
      /\b(not|never|no|cannot)\b/i.test(sentence),
      `unqualified guarantee: ${sentence.trim()}`,
    );
  }
});

test("the disclosures are on page one, not buried at the back", () => {
  // A disclosure a reader has to go looking for is not a disclosure.
  const page1 = resultReportPages(practiceResult(2, 93, 30))[0];
  const text = page1.ops
    .filter((op) => op.kind === "text")
    .map((op) => (op.kind === "text" ? op.text : ""))
    .join(" ");
  assert.ok(/Independent Educational Product/i.test(text), "no disclosure heading");
  assert.ok(/not affiliated/i.test(text), "no independence statement");
});

test("the grade matches the documented convention", () => {
  for (const [accuracy, expected] of [
    [100, "A"],
    [90, "A"],
    [89, "B"],
    [80, "B"],
    [79, "C"],
    [70, "C"],
    [69, "D"],
    [60, "D"],
    [59, "F"],
    [0, "F"],
  ] as [number, string][]) {
    assert.equal(gradeFor(accuracy), expected, `${accuracy}% should be ${expected}`);
  }
});

test("a perfect score over one question is never presented as readiness", () => {
  /*
    The failure this exists to stop: 1 correct out of 1 is 100%, an A, and
    means nothing at all. Evidence has to be able to veto a good score.
  */
  const perfect = {
    total: 1,
    correct: 1,
    incorrect: 0,
    unanswered: 0,
    percentage: 100,
    byDomain: [],
    bySubdomain: [],
    missedIds: [],
    flaggedCount: 0,
  };
  const r = assessReadiness(perfect, 296);
  assert.equal(r.grade, "A", "the arithmetic is still an A");
  assert.equal(r.state, "earlySignal", "but the verdict is not encouraging");
  assert.ok(/too little practice|Early signal/i.test(r.headline));
  assert.ok(!/strong|encourag/i.test(r.verdict.split(".")[0]));
});

test("an empty sitting says there is nothing to grade", () => {
  const empty = {
    total: 10,
    correct: 0,
    incorrect: 0,
    unanswered: 10,
    percentage: 0,
    byDomain: [],
    bySubdomain: [],
    missedIds: [],
    flaggedCount: 0,
  };
  const r = assessReadiness(empty, 296);
  assert.equal(r.state, "noEvidence");
  assert.ok(/nothing to grade/i.test(r.headline));
  assert.ok(/cannot be assessed/i.test(r.verdict));
});

test("evidence can never rescue a bad score, only veto a good one", () => {
  // Exhaustive over the two axes rather than spot-checked: no combination may
  // produce an encouraging verdict without both a high grade and real coverage.
  const bank = 296;
  for (const accuracy of [0, 25, 45, 59, 65, 72, 85, 92, 100]) {
    for (const attempted of [0, 1, 10, 20, 50, 100, 200]) {
      const score = {
        total: Math.max(attempted, 1),
        correct: Math.round((accuracy / 100) * Math.max(attempted, 1)),
        incorrect: 0,
        unanswered: 0,
        percentage: accuracy,
        byDomain: [],
        bySubdomain: [],
        missedIds: [],
        flaggedCount: 0,
      };
      score.unanswered = score.total - attempted < 0 ? 0 : score.total - attempted;
      const r = assessReadiness(score, bank);
      if (r.state === "encouraging") {
        assert.ok(r.grade === "A", `encouraging at grade ${r.grade}`);
        assert.ok(
          attempted / bank >= 0.15,
          `encouraging on ${attempted}/${bank} attempted`,
        );
      }
      if (attempted === 0) {
        assert.equal(r.state, "noEvidence", "no attempt must mean no evidence");
      }
    }
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
  const examBody = resultReportText(exam);
  assert.ok(examBody.includes("Time remaining"), "exam shows what was left");

  const practiceBody = resultReportText(practiceResult());
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

test("every page carries the watermark and a page number", () => {
  const pages = resultReportPages(practiceResult(1, 94, 40));
  assert.ok(pages.length >= 2, "needs a multi-page result to be meaningful");
  pages.forEach((page, i) => {
    const marks = page.ops.filter((op) => op.tag === "watermark");
    assert.equal(marks.length, 1, `page ${i + 1} has ${marks.length} watermarks`);
    const mark = marks[0];
    assert.ok(mark.kind === "text" && /practice only/i.test(mark.text));
    assert.ok(
      mark.opacity > 0 && mark.opacity < 0.25,
      "the watermark must be visible but not obstruct reading",
    );
    const text = page.ops
      .filter((op) => op.kind === "text")
      .map((op) => (op.kind === "text" ? op.text : ""))
      .join(" ");
    assert.ok(
      text.includes(`Page ${i + 1} of ${pages.length}`),
      `page ${i + 1} is not numbered`,
    );
  });
});

test("the document metadata states what the file is", () => {
  const bytes = resultPdfBytes(practiceResult(3, 95, 8));
  const text = Buffer.from(bytes).toString("latin1");
  assert.ok(text.includes("/Title (AI Governance Practice - Results)"));
  assert.ok(text.includes("/Author (NHID-Clinical)"));
  assert.ok(/\/Subject \([^)]*[Nn]ot affiliated/.test(text));
  assert.ok(text.includes("NOT A SOLE STUDY SOURCE"));
  assert.ok(/\/CreationDate \(D:\d{14}Z\)/.test(text));
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
