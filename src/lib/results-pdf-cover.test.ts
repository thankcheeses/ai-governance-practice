import assert from "node:assert/strict";
import test from "node:test";
import { getQuestion } from "@/content/registry";
import {
  practiceGrade,
  practiceVerdict,
  scoreSitting,
} from "./results";
import { resultPdfBytes } from "./results-pdf";
import {
  ACTIVE_SESSION_VERSION,
  type ActiveSession,
} from "./active-session";
import { buildSitting, resultFromActiveSession, sittingComposition } from "./session";
import type { UserProgress } from "./types";

const TRACK = "aigp-preparation" as const;

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

function practiceResult(correctCount = 3, seed = 9001, count = 6) {
  const sitting = buildSitting(emptyProgress(), { seed, count, trackId: TRACK });
  const { questionIds, optionIds } = sittingComposition(sitting);
  const answers: Record<string, string[]> = {};
  questionIds.forEach((id, i) => {
    const question = getQuestion(id)!;
    answers[id] =
      i < correctCount
        ? [...question.correctOptionIds]
        : [question.options.find((o) => !question.correctOptionIds.includes(o.id))!.id];
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
  void ACTIVE_SESSION_VERSION;
  return resultFromActiveSession(snapshot, "2026-01-01T10:12:30.000Z");
}

test("practice grades map percentages onto school letters", () => {
  assert.equal(practiceGrade(95), "A");
  assert.equal(practiceGrade(80), "B");
  assert.equal(practiceGrade(70), "C");
  assert.equal(practiceGrade(60), "D");
  assert.equal(practiceGrade(28), "F");
});

test("the same sitting always draws the same flork", () => {
  const score = scoreSitting(practiceResult(5, 91, 8));
  const a = practiceVerdict(score, "sit-1|2026-01-01T10:12:30.000Z");
  const b = practiceVerdict(score, "sit-1|2026-01-01T10:12:30.000Z");
  assert.equal(a.flork, b.flork);
  assert.equal(a.letter, b.letter);
});

test("the visual cover keeps Courier and adds a school-grade page", () => {
  const bytes = resultPdfBytes(practiceResult(6, 92, 8));
  const text = Buffer.from(bytes).toString("latin1");
  assert.ok(text.includes("/BaseFont /Courier"));
  assert.ok(text.includes("/BaseFont /Helvetica"));
  assert.ok(text.includes("PRACTICE GRADE"));
  assert.ok(text.includes("practice only - not an official exam"));
  assert.ok(text.includes("NOT A SOLE STUDY SOURCE"));
});
