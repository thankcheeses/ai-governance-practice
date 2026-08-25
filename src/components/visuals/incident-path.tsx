"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DiagramShell, StageChip, FlowArrow, RAISED } from "./primitives";

/**
 * AI incident response path.
 *
 * Linear sequence because the teaching point is ordered action under pressure.
 * Each step has a narrow purpose; skipping one is the common failure mode the
 * scenarios test.
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
    <DiagramShell
      title="AI incident response path"
      description="Ordered action under pressure. Select a step to see its purpose, the concrete action, and the common failure mode the scenarios test."
      className={className}
    >
      <div
        role="toolbar"
        aria-label="Incident response steps"
        className="flex flex-wrap items-center justify-center gap-1"
      >
        {STEPS.map((s, i) => (
          <span key={s.id} className="inline-flex items-center gap-1">
            {i > 0 ? <FlowArrow className="hidden sm:inline-flex" /> : null}
            <StageChip
              label={s.label}
              index={i}
              active={active === s.id}
              done={i < activeIndex}
              onClick={() => setActive(s.id)}
            />
          </span>
        ))}
      </div>

      <div
        className={cn(
          "mt-4 rounded-lg border border-border bg-background/70 p-4",
          RAISED,
        )}
      >
        <p className="text-[0.8125rem] font-semibold text-foreground">
          {step.label}
        </p>
        <dl className="mt-3 space-y-2 text-[0.75rem] leading-snug">
          <div>
            <dt className="font-medium text-foreground">Purpose</dt>
            <dd className="mt-0.5 text-muted-foreground">{step.purpose}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Concrete action</dt>
            <dd className="mt-0.5 text-muted-foreground">{step.action}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Common failure</dt>
            <dd className="mt-0.5 text-muted-foreground">{step.fail}</dd>
          </div>
        </dl>
      </div>
    </DiagramShell>
  );
}
