import { DiagramShell } from "./primitives";

/**
 * Explicit distinction between Study mode and Exam mode.
 *
 * Learners often treat practice as a soft exam. Making the difference visible
 * reduces confusion about feedback timing, scoring, and what the product is
 * actually training.
 */

const ROWS = [
  {
    aspect: "Purpose",
    study: "Build judgment through immediate explanation",
    exam: "Simulate timed, no-feedback decision pressure",
  },
  {
    aspect: "Feedback",
    study: "After every answer — rationale, near-misses, takeaway",
    exam: "Only after you submit the full set",
  },
  {
    aspect: "Scoring",
    study: "Running accuracy; used for adaptive focus",
    exam: "Final score only; no mid-session adjustment",
  },
  {
    aspect: "Time",
    study: "Self-paced; can pause and resume",
    exam: "Clock runs; designed to feel like the real sitting",
  },
  {
    aspect: "Review queue",
    study: "Wrong and near-miss items are scheduled for spaced return",
    exam: "Does not write to the review queue",
  },
] as const;

export function StudyExamCompare({ className }: { className?: string }) {
  return (
    <DiagramShell
      title="Study mode vs Exam mode"
      description="Same question bank, different job. Study trains the reasoning loop. Exam tests whether the reasoning holds under constraint."
      className={className}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-[0.75rem] leading-snug">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Aspect</th>
              <th className="py-2 pr-3 font-medium">Study</th>
              <th className="py-2 font-medium">Exam</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.aspect} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  {r.aspect}
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">{r.study}</td>
                <td className="py-2.5 text-muted-foreground">{r.exam}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DiagramShell>
  );
}
