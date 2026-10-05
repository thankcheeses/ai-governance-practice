"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DiagramFrame } from "./primitives";

/**
 * Model drift against concept drift, stage by stage.
 *
 * This was two static columns. Side by side is the right *form* for a
 * comparison — the point is seeing both at once — so the interaction does not
 * collapse it to one card the way the other diagrams select a node. Instead
 * the learner selects a **stage**, and both columns highlight their row for
 * it. That keeps the comparison on screen and makes the thing worth comparing
 * the thing you act on.
 *
 * The contrast line under each stage is drawn from the definitions already in
 * this file rather than added as new claims.
 */

const STAGES = [
  {
    id: "changed",
    label: "What changed",
    model: "Input distribution still looks familiar",
    concept: "The world moved — labels changed meaning",
    contrast:
      "Model drift leaves the inputs looking normal. Concept drift changes what the right answer is.",
  },
  {
    id: "means",
    label: "What it means",
    model: "Predictions degrade anyway",
    concept: "What the model learned is no longer valid",
    contrast:
      "One is a model that has fallen behind. The other is a model answering a question that has changed.",
  },
  {
    id: "response",
    label: "First response",
    model: "Retrain or recalibrate on recent labels",
    concept: "Re-examine the problem definition first",
    contrast:
      "Retraining resolves the first and entrenches the second — fresh labels for a problem nobody has redefined.",
  },
] as const;

const COLUMNS = [
  {
    key: "model",
    title: "Model drift",
    also: "Performance drift · model decay",
    what: "The model's predictions degrade on data that still resembles the training distribution.",
    signal: "Accuracy, calibration, or fairness metrics fall while input features appear stable.",
  },
  {
    key: "concept",
    title: "Concept drift",
    also: "Target drift · label shift",
    what: "The relationship between inputs and the target has changed.",
    signal: "Features may look familiar, but the correct label or optimal action is different.",
  },
] as const;

export function DriftCompare({ className }: { className?: string }) {
  const [active, setActive] = useState<string>(STAGES[0].id);
  const stage = STAGES.find((s) => s.id === active) ?? STAGES[0];

  return (
    <DiagramFrame
      title="Model drift vs concept drift"
      lede="Same symptom — worse outcomes. Different cause. Different first response. Select a stage to compare the two side by side."
      className={className}
      wide
    >
      <div
        role="group"
        aria-label="Drift stages"
        className="mb-5 flex flex-wrap gap-2"
      >
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            aria-pressed={active === s.id}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2",
              "text-[0.8125rem] font-medium tracking-wide transition-colors duration-[120ms]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active === s.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "text-[0.6875rem] font-semibold tabular-nums",
                active === s.id ? "text-primary-foreground/70" : "text-muted-foreground/70",
              )}
            >
              {i + 1}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        {COLUMNS.map((c) => (
          <div
            key={c.key}
            className="rounded-xl border border-border bg-background/70 px-5 py-5"
          >
            <p className="font-serif text-[1.125rem] text-foreground">{c.title}</p>
            <p className="mt-0.5 text-[0.6875rem] tracking-wide text-muted-foreground">
              {c.also}
            </p>

            <ol className="mt-4 space-y-0">
              {STAGES.map((s, i) => {
                const on = s.id === active;
                return (
                  <li key={s.id} className="flex flex-col">
                    {i > 0 ? (
                      <span aria-hidden className="ml-3 h-3 w-px bg-border-strong/40" />
                    ) : null}
                    {/*
                      The inactive rows stay legible rather than disappearing.
                      Dimming them to muted would turn a comparison into a
                      reveal, and the whole argument here is that you can see
                      the two paths at the same time.
                    */}
                    <span
                      className={cn(
                        "-mx-2 flex w-[calc(100%+1rem)] gap-2.5 rounded-md px-2 py-1 text-[0.8125rem] leading-snug",
                        "transition-colors duration-[120ms]",
                        on
                          ? "bg-accent-tint font-medium text-foreground"
                          : "text-foreground/70",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                          on ? "bg-primary" : "bg-border-strong",
                        )}
                      />
                      {s[c.key]}
                    </span>
                  </li>
                );
              })}
            </ol>

            <p className="mt-4 border-t border-border/60 pt-3 text-[0.75rem] leading-relaxed text-muted-foreground">
              {c.what} <span className="text-foreground/80">Signal: {c.signal}</span>
            </p>
          </div>
        ))}
      </div>

      {/*
        Polite rather than silent: the stage buttons change this line and
        nothing else moves, so a screen reader user would otherwise press a
        control and be told nothing happened.
      */}
      <p
        aria-live="polite"
        className="measure mt-5 border-t border-border/70 pt-4 text-[0.875rem] leading-relaxed text-foreground"
      >
        <span className="font-medium">{stage.label}.</span>{" "}
        <span className="text-muted-foreground">{stage.contrast}</span>
      </p>
    </DiagramFrame>
  );
}
