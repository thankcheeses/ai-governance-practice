"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DiagramFrame, FlowArrow } from "./primitives";

const STAGES = [
  {
    id: "govern",
    label: "Govern",
    role: "Continuous",
    objective: "Set culture, roles, and policies that make the other three functions possible.",
    question: "Who is accountable, and what are they allowed to decide?",
    control: "AI risk committee with documented escalation authority",
    evidence: "Charter, RACI, decision log",
  },
  {
    id: "map",
    label: "Map",
    role: "Cycle",
    objective: "Understand context, intended use, and the harms that could arise.",
    question: "What is this system for, and who could be harmed if it fails?",
    control: "Context-of-use statement + preliminary impact assessment",
    evidence: "Use-case card, stakeholder map, harm scenarios",
  },
  {
    id: "measure",
    label: "Measure",
    role: "Cycle",
    objective: "Analyse, assess, and track risk with methods appropriate to the system.",
    question: "How do we know the risk is still within the bounds we set?",
    control: "Evaluation protocol with acceptance thresholds and monitoring signals",
    evidence: "Test reports, metric dashboards, drift alerts",
  },
  {
    id: "manage",
    label: "Manage",
    role: "Cycle",
    objective: "Prioritise, respond to, and recover from risk events.",
    question: "What is the narrowest defensible next action when a signal fires?",
    control: "Incident playbook with containment, escalation, and remediation steps",
    evidence: "Incident tickets, post-mortems, residual-risk register",
  },
] as const;

export function RmfLoop({ className }: { className?: string }) {
  const [active, setActive] = useState<string>("govern");
  const stage = STAGES.find((s) => s.id === active) ?? STAGES[0];
  const cycle = STAGES.filter((s) => s.role === "Cycle");

  return (
    <DiagramFrame
      title="NIST AI Risk Management Framework"
      lede="Govern is continuous. Map, Measure, and Manage form the operational cycle. Select a function to inspect its governance question and controls."
      className={className}
      wide
    >
      <div className="rounded-2xl border border-primary/25 bg-primary/[0.03] p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActive("govern")}
            aria-current={active === "govern" ? "true" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.8125rem] font-semibold tracking-wide transition-colors duration-[120ms]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active === "govern"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary/30 bg-background text-foreground hover:border-primary/50",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                active === "govern" ? "bg-primary-foreground" : "bg-primary",
              )}
            />
            Govern
            <span
              className={cn(
                "text-[0.6875rem] font-medium uppercase tracking-[0.08em]",
                active === "govern" ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              continuous
            </span>
          </button>
          <p className="max-w-sm text-[0.75rem] leading-relaxed text-muted-foreground">
            Culture, roles, and policy that make the cycle possible.
          </p>
        </div>

        <div
          role="toolbar"
          aria-label="AI RMF operational cycle"
          className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/90 px-3 py-4 sm:gap-3 sm:px-5"
        >
          {cycle.map((s, i) => (
            <span key={s.id} className="inline-flex items-center gap-2 sm:gap-3">
              {i > 0 ? <FlowArrow className="hidden sm:inline-flex" /> : null}
              <button
                type="button"
                onClick={() => setActive(s.id)}
                aria-current={active === s.id ? "step" : undefined}
                className={cn(
                  "min-h-10 rounded-full border px-4 py-2 text-[0.8125rem] font-medium tracking-wide transition-colors duration-[120ms]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active === s.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 border-t border-border/70 pt-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <p className="font-serif text-[1.125rem] text-foreground">{stage.label}</p>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">
            {stage.objective}
          </p>
        </div>
        <dl className="space-y-3 text-[0.8125rem] leading-snug">
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
    </DiagramFrame>
  );
}
