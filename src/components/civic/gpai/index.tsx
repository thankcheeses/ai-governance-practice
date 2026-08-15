"use client";

import {
  GateRail,
  LevelLadder,
  LoopRing,
  NarrowingStack,
  RoleGraph,
} from "./diagrams";
import {
  GpaiFrame,
  type GpaiModuleProps,
  type GpaiStage,
} from "./module-frame";

/**
 * The five GPAI teaching modules.
 *
 * These are decision-support content, not decoration: each names a sequence a
 * practitioner actually works through, and each appears only where that
 * sequence is the thing being learned. Placement is deliberate and documented
 * beside each module — scattering all five across every route would make them
 * wallpaper and destroy the signal.
 *
 * The stage copy here is original and describes general governance practice.
 * It states no legal requirement, cites no framework as authority, and is not
 * derived from any certification body's material.
 */

/* ------------------------------------------------------ Pre-launch gate --- */

const PRE_LAUNCH_STAGES: GpaiStage[] = [
  {
    name: "Purpose",
    detail:
      "State what the system is for in one sentence, and what it is not for. A purpose that cannot be written down cannot be governed.",
  },
  {
    name: "Risk",
    detail:
      "Identify who could be harmed and how badly, before asking how likely it is. Severity decides how much scrutiny the rest of the gate needs.",
  },
  {
    name: "Accountability",
    detail:
      "Name the person who answers for this system in production — not the team, the person. An unnamed owner is an unowned system.",
  },
  {
    name: "Controls",
    detail:
      "Decide what must be in place before launch versus what can follow. Controls that arrive after go-live rarely arrive at all.",
  },
  {
    name: "Go-live",
    detail:
      "Record the decision, its date, and what would reverse it. A launch nobody can point to was never really approved.",
  },
];

/**
 * Placement: home current focus, onboarding orientation, and study selection
 * where deployment controls are the subject.
 */
export function PreLaunchGate({ variant, className }: GpaiModuleProps) {
  return (
    <GpaiFrame
      title="The pre-launch gate"
      summary="Five checks that decide whether a system is ready to meet real people. They run in order because each one narrows what the next has to consider."
      mark="gate"
      stages={PRE_LAUNCH_STAGES}
      variant={variant}
      className={className}
      diagram={<GateRail labels={PRE_LAUNCH_STAGES.map((s) => s.name)} />}
    />
  );
}

/* ------------------------------------------------ Oversight comparison --- */

const OVERSIGHT_STAGES: GpaiStage[] = [
  {
    name: "Assist",
    detail:
      "The system suggests; a person decides every case. Slowest and most expensive, and the right choice where a wrong call is hard to undo.",
  },
  {
    name: "Review",
    detail:
      "The system decides; a person checks a sample or every flagged case. Only meaningful if the reviewer can actually overturn the outcome.",
  },
  {
    name: "Intervene",
    detail:
      "The system runs; a person steps in when a signal fires. Depends entirely on the signal being good enough to notice the failures that matter.",
  },
];

/**
 * Placement: study and study/session where human oversight is the subject,
 * and the dashboard's learning recommendations.
 */
export function OversightLevelComparison({ variant, className }: GpaiModuleProps) {
  return (
    <GpaiFrame
      title="Levels of human oversight"
      summary="Three postures, in descending order of human involvement. Choosing one is a judgement about how reversible a wrong outcome is — not about how good the model is."
      mark="oversight"
      stages={OVERSIGHT_STAGES}
      variant={variant}
      className={className}
      diagram={<LevelLadder labels={OVERSIGHT_STAGES.map((s) => s.name)} />}
    />
  );
}

/* ------------------------------------------------------ Accountability --- */

const ACCOUNTABILITY_STAGES: GpaiStage[] = [
  {
    name: "Sponsor",
    detail:
      "Funds the system and owns the business outcome. Decides whether it launches at all.",
  },
  {
    name: "Owner",
    detail:
      "Runs it day to day and answers for its behaviour in production. The single name on the gate.",
  },
  {
    name: "Risk",
    detail:
      "Independently assesses harm and challenges the owner's assessment. Cannot report to the owner and stay independent.",
  },
  {
    name: "Legal",
    detail:
      "Determines which obligations apply and what evidence would satisfy them. Involved before launch, not after a complaint.",
  },
  {
    name: "Operations",
    detail:
      "Handles the cases the system gets wrong. Usually the first to know something has changed.",
  },
];

/**
 * Placement: home governance toolkit, and study questions about role
 * allocation.
 */
export function WhoIsAccountable({ variant, className }: GpaiModuleProps) {
  return (
    <GpaiFrame
      title="Who is accountable?"
      summary="Five roles that between them cover an AI system's life. Most governance failures are not missing controls — they are two of these roles assuming the other one had it."
      mark="accountability"
      stages={ACCOUNTABILITY_STAGES}
      variant={variant}
      className={className}
      diagram={
        <RoleGraph
          centre="Owner"
          around={["Sponsor", "Risk", "Legal", "Operations"]}
        />
      }
    />
  );
}

/* ---------------------------------------------------------- Monitoring --- */

const MONITORING_STAGES: GpaiStage[] = [
  {
    name: "Signal",
    detail:
      "Something measurable changes — accuracy, complaint volume, the mix of who the system sees. A signal nobody looks at is not monitoring.",
  },
  {
    name: "Investigate",
    detail:
      "Establish whether the change is real and what caused it. Most alerts are the measurement moving, not the system.",
  },
  {
    name: "Act",
    detail:
      "Change something: the model, the threshold, the oversight level, or the decision to keep running at all.",
  },
  {
    name: "Document",
    detail:
      "Record what happened and what was done. This is the evidence that the control existed when it mattered.",
  },
  {
    name: "Learn",
    detail:
      "Feed it back into the signals you watch. Monitoring that never changes what it monitors is monitoring the past.",
  },
];

/**
 * Placement: review and review/session, deployment-focused study, and the
 * dashboard's post-deployment focus.
 */
export function MonitoringThatActuallyWorks({ variant, className }: GpaiModuleProps) {
  return (
    <GpaiFrame
      title="Monitoring that actually works"
      summary="A loop, not a dashboard. The last stage is what separates monitoring from watching: what you learned has to change what you watch next."
      mark="monitoring"
      stages={MONITORING_STAGES}
      variant={variant}
      className={className}
      diagram={<LoopRing labels={MONITORING_STAGES.map((s) => s.name)} />}
    />
  );
}

/* ----------------------------------------------------- Decision frame --- */

const DECISION_STAGES: GpaiStage[] = [
  {
    name: "Facts",
    detail:
      "What is actually described — the system, who it affects, what stage it is at. Separate this from what you assume is going on.",
  },
  {
    name: "Obligations",
    detail:
      "What is required here, and by whom. Obligations attach to roles and contexts, so establish those before reaching for a rule.",
  },
  {
    name: "Risks",
    detail:
      "What could go wrong for the people on the receiving end, ranked by how badly rather than how likely.",
  },
  {
    name: "Action",
    detail:
      "The narrowest step that addresses the risk you identified. A defensible answer names its trade-off rather than pretending there is none.",
  },
];

/**
 * Placement: public entry demo, study session, onboarding, and complex review
 * questions.
 */
export function ScenarioDecisionFrame({ variant, className }: GpaiModuleProps) {
  return (
    <GpaiFrame
      title="How to read a governance scenario"
      summary="Four passes over the same text. Working in this order stops the common failure: recognising a framework and answering from it before establishing what is actually happening."
      mark="decision"
      stages={DECISION_STAGES}
      variant={variant}
      className={className}
      diagram={<NarrowingStack labels={DECISION_STAGES.map((s) => s.name)} />}
    />
  );
}
