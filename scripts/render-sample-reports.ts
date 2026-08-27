/*
  Renders one results PDF per result shape, so the real files can be opened and
  looked at rather than reasoned about.

  Unit tests can prove the numbers on the page match the result and that bars
  are geometry rather than characters. They cannot see a clipped heading, a
  figure drawn off the edge of its card, or text running under a box. This
  produces the artefacts for that check.

    npm run render:reports            # writes to ./tmp-reports
    npm run render:reports -- /path   # or anywhere else

  Six shapes, chosen because each one exercises a different branch of the
  readiness model — including the two that the model exists to get right: a
  sitting nobody answered, and a perfect score over a single question.
*/
import { mkdirSync, writeFileSync } from "node:fs";
import { getQuestion } from "@/content/registry";
import { type CompletedResult, RESULT_VERSION, scoreResult } from "@/lib/results";
import { assessReadiness } from "@/lib/readiness";
import { resultPdfBytes, resultPdfFilename } from "@/lib/results-pdf";
import { buildSitting, sittingComposition } from "@/lib/session";
import { emptyProgress } from "@/lib/types";

const TRACK = "aigp-preparation" as const;
const outDir = process.argv[2] ?? "tmp-reports";
const NOW = new Date("2026-08-26T10:12:00Z");

/**
 * Build a finished result with a chosen accuracy and completion.
 *
 * `correctShare` applies to the questions that were answered; `answeredShare`
 * decides how many were answered at all. Keeping the two independent is the
 * whole point — they are the two axes the report is judged on.
 */
function make(
  name: string,
  count: number,
  correctShare: number,
  answeredShare: number,
  mode: "practice" | "exam" = "practice",
): CompletedResult {
  const seed = 4242 + name.length * 7;
  const sitting = buildSitting(emptyProgress(), { seed, count, trackId: TRACK });
  const { questionIds, optionIds } = sittingComposition(sitting);
  const answers: Record<string, string[]> = {};
  const answered = Math.round(count * answeredShare);
  const correct = Math.round(answered * correctShare);

  questionIds.forEach((id, i) => {
    if (i >= answered) return; // left blank
    const question = getQuestion(id);
    if (!question) return;
    answers[id] =
      i < correct
        ? [...question.correctOptionIds]
        : [
            question.options.find((o) => !question.correctOptionIds.includes(o.id))!
              .id,
          ];
  });

  return {
    version: RESULT_VERSION,
    mode,
    sittingId: `${name}-sitting`,
    trackId: TRACK,
    label: mode === "exam" ? `Exam - ${count} questions` : "Mixed practice",
    seed,
    questionIds,
    optionIds,
    answers,
    flagged: mode === "exam" ? questionIds.slice(0, 2) : [],
    startedAt: "2026-08-26T09:00:00.000Z",
    completedAt: "2026-08-26T10:12:00.000Z",
    reason: "completed",
    durationMs: mode === "exam" ? 3_600_000 : null,
    deadline: mode === "exam" ? "2026-08-26T10:00:00.000Z" : null,
  };
}

const shapes: [string, CompletedResult][] = [
  ["1-high-score-high-completion", make("high", 120, 0.93, 1)],
  ["2-moderate", make("moderate", 60, 0.78, 1)],
  ["3-low-score-timed", make("low", 50, 0.42, 1, "exam")],
  ["4-nothing-attempted", make("zero", 20, 0, 0)],
  ["5-partial-completion", make("partial", 30, 0.7, 0.5)],
  ["6-perfect-over-one-question", make("tiny", 1, 1, 1)],
];

mkdirSync(outDir, { recursive: true });
console.log(`writing to ${outDir}/\n`);

for (const [name, result] of shapes) {
  const score = scoreResult(result);
  const readiness = assessReadiness(score);
  const bytes = resultPdfBytes(result, { now: NOW });
  writeFileSync(`${outDir}/${name}.pdf`, bytes);
  console.log(
    `${name.padEnd(30)} ${String(bytes.length).padStart(6)}B  ` +
      `${String(score.percentage).padStart(3)}%  grade ${readiness.grade}  ` +
      `${String(readiness.attempted).padStart(3)} attempted  ` +
      `${readiness.evidence.padEnd(12)} ${readiness.state}`,
  );
}
console.log(`\nfilename pattern: ${resultPdfFilename(shapes[0][1])}`);
