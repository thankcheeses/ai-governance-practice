import type { Scenario } from "@/content/types";

/**
 * Sorts a scenario's fact list into the lanes of a case board.
 *
 * The board is a visual aid for reading the brief, not new content: every fact
 * appears exactly once, verbatim, in the lane its label points at. Nothing is
 * summarised, inferred or added. A label that matches no lane goes to
 * "Context" rather than being forced somewhere it does not belong.
 *
 * The lanes follow the order the four-pass method reads a scenario in — who is
 * involved, what the system does with what data, which rules and promises
 * apply, what the warning signs are — and end on the decision being asked for.
 */

export type LaneId = "people" | "system" | "rules" | "signals" | "decision" | "context";

export interface Lane {
  id: LaneId;
  title: string;
  /** One line telling the learner what to look for in this lane. */
  prompt: string;
}

export const LANES: readonly Lane[] = [
  { id: "people", title: "Who's involved", prompt: "Who builds it, who uses it, who decides." },
  { id: "system", title: "System & data", prompt: "What it does and what it runs on." },
  { id: "rules", title: "Rules & promises", prompt: "Laws, contracts and notices in play." },
  { id: "signals", title: "Warning signs", prompt: "Evidence, gaps and red flags." },
  { id: "decision", title: "The call to make", prompt: "What is being asked for right now." },
  { id: "context", title: "Context", prompt: "Other facts in the brief." },
];

/** Checked in order; the first lane whose pattern matches the label wins. */
const RULES: readonly [LaneId, RegExp][] = [
  ["decision", /decision\b(?! role)|proposed|expansion|emerging use|stakes|consequence|lifecycle|open questions/i],
  ["signals", /signal|finding|evidence|claim|validation|pilot|alert|override|monitoring|known interaction|loss|dispute|pressure|reasons recorded/i],
  ["rules", /jurisdiction|regulat|disclosure|notice|contract|terms|commitment|consultation|transparency|markets|labell?ing/i],
  ["people", /role|owner|audience|governance involvement|human review|human oversight|autonomy/i],
  ["system", /feature|training data|data|retention|intake|protected attributes|personali[sz]ation|retraining|system|generative|change history|visibility|clinical boundary|downstream|purpose|scale/i],
];

export function laneFor(label: string): LaneId {
  for (const [lane, pattern] of RULES) if (pattern.test(label)) return lane;
  return "context";
}

export interface BoardLane extends Lane {
  facts: { label: string; value: string }[];
}

/** The lanes that have at least one fact, in reading order. */
export function buildBoard(scenario: Pick<Scenario, "facts">): BoardLane[] {
  const facts = scenario.facts ?? [];
  return LANES.map((lane) => ({
    ...lane,
    facts: facts.filter((f) => laneFor(f.label) === lane.id),
  })).filter((lane) => lane.facts.length > 0);
}
