import { DiagramFrame } from "./primitives";

/**
 * Model drift vs concept drift as parallel paths.
 * The structural difference is readable before the prose.
 */

const CARDS = [
  {
    id: "model",
    title: "Model drift",
    also: "Performance drift · model decay",
    path: [
      "Input distribution still looks familiar",
      "Predictions degrade anyway",
      "Retrain or recalibrate on recent labels",
    ],
    what: "The model's predictions degrade on data that still resembles the training distribution.",
    signal: "Accuracy, calibration, or fairness metrics fall while input features appear stable.",
  },
  {
    id: "concept",
    title: "Concept drift",
    also: "Target drift · label shift",
    path: [
      "The world moved — labels changed meaning",
      "What the model learned is no longer valid",
      "Re-examine the problem definition first",
    ],
    what: "The relationship between inputs and the target has changed.",
    signal: "Features may look familiar, but the correct label or optimal action is different.",
  },
] as const;

export function DriftCompare({ className }: { className?: string }) {
  return (
    <DiagramFrame
      title="Model drift vs concept drift"
      lede="Same symptom — worse outcomes. Different cause. Different first response."
      className={className}
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        {CARDS.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-border bg-background/70 px-5 py-5"
          >
            <p className="font-serif text-[1.125rem] text-foreground">{c.title}</p>
            <p className="mt-0.5 text-[0.6875rem] tracking-wide text-muted-foreground">
              {c.also}
            </p>
            <ol className="mt-4 space-y-0">
              {c.path.map((step, i) => (
                <li key={step} className="flex flex-col">
                  {i > 0 ? (
                    <span aria-hidden className="ml-3 h-3 w-px bg-border-strong/40" />
                  ) : null}
                  <span className="flex gap-2.5 text-[0.8125rem] leading-snug text-foreground/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border-strong" />
                    {step}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-border/60 pt-3 text-[0.75rem] leading-relaxed text-muted-foreground">
              {c.what}{" "}
              <span className="text-foreground/80">Signal: {c.signal}</span>
            </p>
          </div>
        ))}
      </div>
    </DiagramFrame>
  );
}
