import type { TrackId } from "./types";

/**
 * Lab catalog — data structures only.
 *
 * A Lab is a deeper applied product than a track: case studies, simulations,
 * decision trees, architecture diagrams, and practitioner scenarios in one
 * domain. None exist yet.
 *
 * This file deliberately contains no routes, pages, or components. It exists so
 * that when a lab does ship, the work is: add its content folder, register its
 * track, flip `status` to "available". Nothing here renders anywhere in the app
 * today.
 *
 * Each lab maps to a `TrackId` so lab content reuses the existing track
 * machinery — question bank, SM-2 scheduling, progress — rather than needing a
 * parallel system.
 */

export type LabStatus = "planned" | "available";

export interface Lab {
  id: string;
  name: string;
  /** The governance problem this lab trains judgment for. */
  premise: string;
  /** Track that will hold the lab's content once authored. */
  trackId: TrackId;
  status: LabStatus;
  /** Formats this lab will use beyond standard scenario questions. */
  formats: LabFormat[];
}

export type LabFormat =
  | "case-study"
  | "simulation"
  | "decision-tree"
  | "architecture-diagram"
  | "practitioner-scenario";

export const LABS: Lab[] = [
  {
    id: "healthcare-ai-governance",
    name: "Healthcare AI Governance Lab",
    premise:
      "Clinical decision support, PHI handling, and vendor oversight where a governance error reaches a patient.",
    trackId: "healthcare-ai-governance",
    status: "planned",
    formats: ["case-study", "practitioner-scenario", "decision-tree"],
  },
  {
    id: "voice-ai-governance",
    name: "Voice AI Governance Lab",
    premise:
      "Disclosure sequencing, escalation design, and auditability for agents that speak to members and patients.",
    trackId: "voice-ai-governance",
    status: "planned",
    formats: ["simulation", "decision-tree", "practitioner-scenario"],
  },
  {
    id: "agentic-ai-governance",
    name: "Agentic AI Governance Lab",
    premise:
      "Action scoping, least privilege, and reversibility for systems that act rather than recommend.",
    trackId: "agentic-ai-governance",
    status: "planned",
    formats: ["simulation", "architecture-diagram", "decision-tree"],
  },
  {
    id: "eu-ai-act-operations",
    name: "EU AI Act Operationalization Lab",
    premise:
      "Turning classification, conformity, and post-market obligations into controls a team can actually run.",
    trackId: "eu-ai-act-operations",
    status: "planned",
    formats: ["case-study", "decision-tree", "practitioner-scenario"],
  },
];

/** Labs a learner can actually open. Empty until content ships. */
export const AVAILABLE_LABS = LABS.filter((lab) => lab.status === "available");

export function getLab(id: string): Lab | undefined {
  return LABS.find((lab) => lab.id === id);
}
