import { cn } from "@/lib/utils";
import { DiagramShell, RAISED } from "./primitives";

/**
 * Model drift vs concept drift.
 *
 * Side-by-side cards because the teaching point is the distinction itself.
 * Many scenarios test whether the learner notices which kind of drift is
 * present and therefore which control is appropriate.
 */

const CARDS = [
  {
    id: "model",
    title: "Model drift",
    also: "Also called: performance drift, model decay",
    what: "The model's predictions get worse on data that still looks like the training distribution.",
    signal: "Accuracy, calibration, or fairness metrics degrade while input features appear stable.",
    response:
      "Retrain or recalibrate on recent labelled data; check whether the training pipeline itself changed.",
  },
  {
    id: "concept",
    title: "Concept drift",
    also: "Also called: target drift, label shift",
    what: "The relationship between inputs and the target has changed — the world moved.",
    signal: "Feature distributions may still look familiar, but the correct label or optimal action is different.",
    response:
      "Re-examine the problem definition and labels; do not simply retrain on the old target definition.",
  },
] as const;

export function DriftCompare({ className }: { className?: string }) {
  return (
    <DiagramShell
      title="Model drift vs concept drift"
      description="Same symptom (worse outcomes), different cause, different control. The scenarios test whether you can tell which one you are looking at."
      className={className}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((c) => (
          <div
            key={c.id}
            className={cn(
              "rounded-lg border border-border bg-background/70 p-3.5",
              RAISED,
            )}
          >
            <p className="text-[0.8125rem] font-semibold text-foreground">
              {c.title}
            </p>
            <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
              {c.also}
            </p>
            <dl className="mt-3 space-y-2 text-[0.75rem] leading-snug">
              <div>
                <dt className="font-medium text-foreground">What changed</dt>
                <dd className="mt-0.5 text-muted-foreground">{c.what}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Typical signal</dt>
                <dd className="mt-0.5 text-muted-foreground">{c.signal}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">First response</dt>
                <dd className="mt-0.5 text-muted-foreground">{c.response}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </DiagramShell>
  );
}
