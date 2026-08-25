"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DiagramShell, StageChip, FlowArrow, RAISED } from "./primitives";

/**
 * Interactive NIST AI RMF function loop.
 *
 * Shape is a closed cycle (Govern sits above the Map → Measure → Manage path)
 * because the framework's claim is continuous, not linear. Selecting a stage
 * reveals the governance question and an example control — the interaction
 * is the teaching device.
 */

const STAGES = [
  {
    id: "govern",
    label: "Govern",
    objective: "Set culture, roles, and policies that make the other three functions possible.",
    question: "Who is accountable, and what are they allowed to decide?",
    control: "AI risk committee with documented escalation authority",
    evidence: "Charter, RACI, decision log",
  },
  {
    id: "map",
    label: "Map",
    objective: "Understand context, intended use, and the harms that could arise.",
    question: "What is this system for, and who could be harmed if it fails?",
    control: "Context-of-use statement + preliminary impact assessment",
    evidence: "Use-case card, stakeholder map, harm scenarios",
  },
  {
    id: "measure",
    label: "Measure",
    objective: "Analyse, assess, and track risk with methods appropriate to the system.",
    question: "How do we know the risk is still within the bounds we set?",
    control: "Evaluation protocol with acceptance thresholds and monitoring signals",
    evidence: "Test reports, metric dashboards, drift alerts",
  },
  {
    id: "manage",
    label: "Manage",
    objective: "Prioritise, respond to, and recover from risk events.",
    question: "What is the narrowest defensible next action when a signal fires?",
    control: "Incident playbook with containment, escalation, and remediation steps",
    evidence: "Incident tickets, post-mortems, residual-risk register",
  },
] as const;

export function RmfLoop({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>("govern");
  const stage = STAGES.find((s) => s.id === active) ?? STAGES[0];

  return (
    <DiagramShell
      title="NIST AI RMF functions"
      description="Govern is continuous. Map, Measure, and Manage form a cycle. Select a stage to see the governance question and an example control."
      className={className}
    >
      <div
        role="toolbar"
        aria-label="AI RMF stages"
        className="flex flex-wrap items-center justify-center gap-1.5"
      >
        {STAGES.map((s, i) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            {i > 0 ? <FlowArrow /> : null}
            <StageChip
              label={s.label}
              index={i}
              active={active === s.id}
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
          {stage.label}
        </p>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {stage.objective}
        </p>
        <dl className="mt-3 space-y-2 text-[0.75rem] leading-snug">
          <div>
            <dt className="font-medium text-foreground">Governance question</dt>
            <dd className="mt-0.5 text-muted-foreground">{stage.question}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Example control</dt>
            <dd className="mt-0.5 text-muted-foreground">{stage.control}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Evidence artifact</dt>
            <dd className="mt-0.5 text-muted-foreground">{stage.evidence}</dd>
          </div>
        </dl>
      </div>
    </DiagramShell>
  );
}
