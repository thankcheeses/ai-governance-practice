"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DiagramFrame } from "./primitives";

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
    objective: "Analyze, assess, and track risk with methods appropriate to the system.",
    question: "How do we know the risk is still within the bounds we set?",
    control: "Evaluation protocol with acceptance thresholds and monitoring signals",
    evidence: "Test reports, metric dashboards, drift alerts",
  },
  {
    id: "manage",
    label: "Manage",
    role: "Cycle",
    objective: "Prioritize, respond to, and recover from risk events.",
    question: "What is the narrowest defensible next action when a signal fires?",
    control: "Incident playbook with containment, escalation, and remediation steps",
    evidence: "Incident tickets, post-mortems, residual-risk register",
  },
] as const;

/*
  The geometry, computed rather than typed as magic numbers.

  This diagram used to be three pills in a row with arrows between them, which
  described a pipeline. The framework it is teaching is a cycle sitting inside a
  continuous governance function, and a row cannot say that — a learner reading
  it would take Manage for an end state rather than the step that returns to
  Map. So the cycle is drawn as a cycle, and Govern is the ring it happens
  inside rather than a fourth box in the queue.
*/
const VIEW = { w: 340, h: 290 };
const CENTER = { x: 170, y: 150 };
/** Where the three cycle nodes sit. */
const NODE_R = 80;
/** The arc the connecting arrows ride, pulled inside the nodes. */
const ARC_R = 86;
/** Degrees of arc left clear at each end so an arrow never touches a node. */
const CLEAR = 27;

const polar = (deg: number, r: number) => ({
  x: CENTER.x + r * Math.cos((deg * Math.PI) / 180),
  y: CENTER.y + r * Math.sin((deg * Math.PI) / 180),
});

/** Clockwise from the top: Map, Measure, Manage. */
const ANGLE = { map: -90, measure: 30, manage: 150 } as const;

/** One arrow, as an arc plus a head rotated to the tangent at its end. */
function arc(fromDeg: number, toDeg: number) {
  const a1 = fromDeg + CLEAR;
  const a2 = toDeg - CLEAR;
  const s = polar(a1, ARC_R);
  const e = polar(a2, ARC_R);
  return {
    d: `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${ARC_R} ${ARC_R} 0 0 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`,
    head: { ...e, angle: a2 + 90 },
  };
}

const ARROWS = [
  arc(ANGLE.map, ANGLE.measure),
  arc(ANGLE.measure, ANGLE.manage),
  arc(ANGLE.manage, ANGLE.map + 360),
];

/** Node centers as percentages, so the real buttons can sit over the drawing. */
const NODE_POS = (Object.keys(ANGLE) as (keyof typeof ANGLE)[]).reduce(
  (acc, key) => {
    const p = polar(ANGLE[key], NODE_R);
    acc[key] = { left: `${(p.x / VIEW.w) * 100}%`, top: `${(p.y / VIEW.h) * 100}%` };
    return acc;
  },
  {} as Record<keyof typeof ANGLE, { left: string; top: string }>,
);

export function RmfLoop({ className }: { className?: string }) {
  const [active, setActive] = useState<string>("govern");
  const stage = STAGES.find((s) => s.id === active) ?? STAGES[0];

  return (
    <DiagramFrame
      title="NIST AI Risk Management Framework"
      lede="Govern runs continuously around the operational cycle. Select a function to inspect its governance question and controls."
      className={className}
      wide
    >
      <div className="mx-auto w-full max-w-[22rem]">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
        >
          {/*
            The drawing is decoration: every label it carries is also rendered
            as real text in the controls above it or the panel below, so a
            screen reader loses nothing by skipping it.
          */}
          <svg
            viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            {/* The Govern ring. Dashed because it is a condition, not a step. */}
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r={128}
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth={1.5}
              strokeDasharray="5 7"
              opacity={active === "govern" ? 1 : 0.55}
            />
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r={112}
              fill="var(--accent-tint)"
              opacity={active === "govern" ? 0.5 : 0.22}
            />

            {/*
              The arrows carry the one thing the old row of pills could not
              say — that this returns to Map rather than ending at Manage — so
              they are drawn at ink weight rather than as hairline decoration.
              `--border-strong` is a 0.18-alpha rule color and was too faint
              to read as direction at this size.
            */}
            {ARROWS.map((a, i) => (
              <g
                key={i}
                stroke="var(--muted-foreground)"
                strokeWidth={2}
                fill="none"
                opacity={0.6}
              >
                <path d={a.d} strokeLinecap="round" />
                {/* Head drawn at the arc's end, turned to its tangent. */}
                <path
                  d="M -5.5 -5.5 L 0 0 L -5.5 5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform={`translate(${a.head.x.toFixed(1)} ${a.head.y.toFixed(1)}) rotate(${a.head.angle.toFixed(1)})`}
                />
              </g>
            ))}
          </svg>

          {/*
            Govern sits on the ring rather than in the cycle, with the card
            color behind it so the ring reads as passing underneath — the
            whole point being that it surrounds the other three.
          */}
          <StageButton
            stage={STAGES[0]}
            active={active === "govern"}
            onSelect={setActive}
            className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
            suffix="continuous"
          />
          {(["map", "measure", "manage"] as const).map((id) => {
            const s = STAGES.find((x) => x.id === id)!;
            return (
              <StageButton
                key={id}
                stage={s}
                active={active === id}
                onSelect={setActive}
                className="-translate-x-1/2 -translate-y-1/2"
                style={NODE_POS[id]}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-5 border-t border-border/70 pt-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
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

/**
 * A real `<button>` positioned over the drawing.
 *
 * The nodes are not SVG shapes with click handlers. Keeping them as ordinary
 * buttons means focus, hit area and the pointer cursor all behave the way the
 * rest of the app does, and the diagram underneath can stay `aria-hidden`.
 */
function StageButton({
  stage,
  active,
  onSelect,
  className,
  style,
  suffix,
}: {
  stage: (typeof STAGES)[number];
  active: boolean;
  onSelect: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
  suffix?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(stage.id)}
      aria-pressed={active}
      style={style}
      className={cn(
        "absolute inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border",
        "px-3.5 py-2 text-[0.8125rem] font-medium tracking-wide",
        "transition-colors duration-[120ms]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
          : "border-border bg-card text-muted-foreground shadow-[var(--shadow-raised)] hover:border-border-strong hover:text-foreground",
        className,
      )}
    >
      {stage.label}
      {suffix ? (
        <span
          className={cn(
            "text-[0.625rem] font-semibold uppercase tracking-[0.08em]",
            active ? "text-primary-foreground/75" : "text-muted-foreground/75",
          )}
        >
          {suffix}
        </span>
      ) : null}
    </button>
  );
}
