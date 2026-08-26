"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DiagramFrame, FlowArrow } from "./primitives";

/**
 * AI incident response as an ordered operational pathway.
 */

const STEPS = [
  {
    id: "detect",
    label: "Detect",
    purpose: "Surface the signal that something is wrong.",
    action: "Monitoring alert, user report, or model-behaviour anomaly is recorded and timestamped.",
    fail: "No one is watching, or the signal is dismissed as noise.",
  },
  {
    id: "triage",
    label: "Triage",
    purpose: "Decide severity and who must be involved.",
    action: "Classify impact (safety, privacy, fairness, availability) and route to the right owner within the defined window.",
    fail: "Treated as a pure IT ticket; governance and legal stay out of the loop.",
  },
  {
    id: "contain",
    label: "Contain",
    purpose: "Stop further harm without destroying evidence.",
    action: "Throttle, disable, or isolate the affected capability while preserving logs and model state for later analysis.",
    fail: "Full wipe or silent rollback that erases the trail needed for root-cause work.",
  },
  {
    id: "escalate",
    label: "Escalate",
    purpose: "Bring the accountable people into the decision.",
    action: "Notify the named risk owner, legal, and (when required) external parties per the playbook.",
    fail: "Engineers try to fix it alone; leadership learns after the press call.",
  },
  {
    id: "notify",
    label: "Notify",
    purpose: "Meet legal and contractual notice obligations.",
    action: "Deliver required notices to regulators, customers, or data subjects inside statutory / contractual clocks.",
    fail: "Waiting for perfect root cause before any notice goes out.",
  },
  {
    id: "remediate",
    label: "Remediate",
    purpose: "Fix the underlying cause and restore service under control.",
    action: "Patch, retrain, or redesign; re-run acceptance tests; document residual risk.",
    fail: "Return to production without a new control or acceptance gate.",
  },
  {
    id: "monitor",
    label: "Monitor",
    purpose: "Confirm the fix holds and the same class of failure does not recur.",
    action: "Heightened monitoring for a defined period; close the incident only when criteria are met.",
    fail: "Declare victory and turn the alerts back to default sensitivity.",
  },
] as const;

export function IncidentPath({ className }: { className?: string }) {
  const [active, setActive] = useState<string>("detect");
  const step = STEPS.find((s) => s.id === active) ?? STEPS[0];
  const activeIndex = STEPS.findIndex((s) => s.id === active);

  return (
    <DiagramFrame
      title="AI incident response path"
      lede="Ordered action under pressure. Select a step to see its purpose, the concrete action, and the common failure mode."
      className={className}
      wide
    >
      <div
        role="toolbar"
        aria-label="Incident response steps"
        className="flex flex-wrap items-center justify-center gap-1.5"
      >
        {STEPS.map((s, i) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            {i > 0 ? (
              <FlowArrow className="hidden text-border-strong/50 sm:inline-flex" />
            ) : null}
            <button
              type="button"
              onClick={() => setActive(s.id)}
              aria-current={active === s.id ? "step" : undefined}
              className={cn(
                "min-h-9 rounded-full border px-3 py-1.5 text-[0.75rem] font-medium tracking-wide transition-colors duration-[120ms]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active === s.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < activeIndex
                    ? "border-border-strong/40 bg-secondary text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-5 border-t border-border/70 pt-5 sm:grid-cols-3">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Purpose
          </p>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-foreground">{step.purpose}</p>
        </div>
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Concrete action
          </p>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-foreground/90">{step.action}</p>
        </div>
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Common failure
          </p>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-foreground/90">{step.fail}</p>
        </div>
      </div>
    </DiagramFrame>
  );
}
