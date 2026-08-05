/**
 * Appends enrichment metadata for questions 51–82 to the AIGP enrichment map.
 *
 * `normalize()` throws when a question has no entry, so the bank cannot load
 * until every id is covered. Difficulty follows the existing convention:
 * foundational for recognising a concept, applied for a situated judgement,
 * advanced for a decision balancing several controls or obligations.
 *
 * Run once: node scripts/add-enrichment-batch-2.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "src/content/tracks/aigp-preparation/enrichment.ts";

const ENTRIES = [
  [51, "foundational", "Non-determinism is the dividing line. If the same input can produce different outputs, reading the logic no longer tells you how the system behaves, and monitoring becomes a control rather than a nicety.", ["AI Governance", "Responsible AI"]],
  [52, "foundational", "Explainability is about the person relying on the output, not the engineer who built it. If a decision-maker cannot state why the system ranked one option above another, the principle is not satisfied.", ["Responsible AI"]],
  [53, "applied", "A governance body only sees the risks its members are trained to see. Single-function composition is itself a risk finding, regardless of how strong that function is.", ["AI Governance"]],
  [54, "applied", "Deployer duties attach to operating a system in your own context, not to building it. You can owe governance obligations for a model you had no hand in training.", ["AI Governance", "EU AI Act"]],
  [55, "applied", "Extend existing policy rather than replacing or ignoring it. The institutional maturity in a mature privacy policy is worth keeping; what it lacks is AI-specific coverage like provenance and drift.", ["AI Governance"]],
  [56, "applied", "Pre-AI procurement questionnaires do not ask the questions AI risk turns on. Update the assessment and the contract before the purchase, not after the tool is in production.", ["AI Governance", "AI Risk Management"]],
  [57, "foundational", "Purpose limitation binds you to the purpose disclosed at collection. Repurposing existing data for a new AI feature is a privacy decision before it is a product decision.", ["Responsible AI"]],
  [58, "applied", "Fully automated decisions with significant effects trigger specific duties, typically a route to human intervention and a way to contest. The trigger is the absence of human involvement, not the technology used.", ["Responsible AI", "EU AI Act"]],
  [59, "foundational", "Training data is somebody's property. Copyright applies to what a model learns from, not only to what it produces.", ["AI Governance"]],
  [60, "advanced", "Discrimination does not require the protected trait as an input. A neutral feature that correlates with it can produce the same outcome, which is why disparate impact is tested for rather than assumed away.", ["Responsible AI", "AI Risk Management"]],
  [61, "applied", "Risk tier follows the consequence for the person, not the sophistication of the tool. Anything gating access to employment sits high regardless of whether a human signs off.", ["EU AI Act"]],
  [62, "advanced", "Model-level and use-case-level obligations stack rather than substitute. Building a general-purpose model does not exempt you because you cannot foresee downstream use.", ["EU AI Act"]],
  [63, "foundational", "Govern, map, measure, manage identifies the NIST AI RMF — a voluntary framework, not binding law and not a certifiable standard.", ["NIST AI RMF"]],
  [64, "foundational", "ISO/IEC 42001 is the certifiable one. If the goal is an audited certificate for an AI management system, that is the standard; the rest serve terminology, assessment, or voluntary risk work.", ["ISO 42001"]],
  [65, "applied", "Undefined scope makes every later governance activity weaker. You cannot assess risk against a use case nobody has written down.", ["AI Governance", "AI Risk Management"]],
  [66, "advanced", "Prioritise by severity and likelihood: eliminate, then reduce, then control, then accept with monitoring. Treating all risks equally and escalating everything are both ways of avoiding the judgement.", ["AI Risk Management", "NIST AI RMF"]],
  [67, "applied", "Design documentation exists so you can defend a decision later, to a regulator or an affected person. Its value is proactive, and code comments do not substitute for it.", ["AI Governance"]],
  [68, "foundational", "Lineage and provenance mean knowing where data came from and what was done to it. Without that trail you cannot answer questions about a model's inputs after the fact.", ["AI Governance"]],
  [69, "foundational", "Accuracy and fairness are separate properties tested separately. A model can be accurate overall and still disadvantage a group systematically.", ["Responsible AI", "AI Risk Management"]],
  [70, "foundational", "Strong on training data, weak on new data means the model learned the sample rather than the pattern. Catching it is what a held-out test set is for.", ["AI Risk Management"]],
  [71, "foundational", "A model card carries intended use, limitations, and performance in a standard shape, so the people adopting a model inherit its caveats rather than discovering them.", ["Responsible AI"]],
  [72, "applied", "Accuracy decaying with no code change points to drift: the world moved, the model did not. The response is monitoring plus a retraining cadence, not a one-off fix.", ["AI Risk Management", "NIST AI RMF"]],
  [73, "applied", "Transparency to a deployer means giving them what they need to operate safely — documentation, instructions, monitoring plans — not marketing material and not the raw training set.", ["EU AI Act"]],
  [74, "applied", "Readiness is a property of the people, not the model. A capable tool used by untrained staff is an unassessed risk.", ["AI Governance", "Responsible AI"]],
  [75, "applied", "The governance difference between open and proprietary models is visibility and control. Licensing model says nothing about accuracy, and nothing about whether obligations apply.", ["AI Governance"]],
  [76, "applied", "Retrieval keeps answers current without retraining, by grounding them in approved sources at query time. It is the standard answer to content that changes faster than a training cycle.", ["AI Governance"]],
  [77, "applied", "Assess before you sign. Once the contract is executed, the leverage to change terms or walk away is gone.", ["AI Risk Management", "AI Governance"]],
  [78, "advanced", "Contractual silence on liability is a finding, not a neutral fact. Resolve it by negotiation before signature rather than assuming it falls on the vendor.", ["AI Governance"]],
  [79, "advanced", "Building your own model adds developer obligations on top of deployer ones. More control means more responsibility, not less.", ["AI Governance", "EU AI Act"]],
  [80, "applied", "Passing pre-deployment testing is a starting gate, not a finish line. Continuous monitoring and a retraining schedule are what keep a live system inside its tested envelope.", ["NIST AI RMF", "AI Risk Management"]],
  [81, "applied", "Systems get used for things nobody assessed. Watching for secondary use is a standing deployment duty, because the original assessment does not cover the new use.", ["AI Risk Management"]],
  [82, "advanced", "Build the off switch before you need it. Being able to deactivate or localise a system per market is what lets you answer a regulator quickly without shutting down everywhere.", ["AI Governance", "EU AI Act"]],
];

const block = ENTRIES.map(
  ([id, difficulty, keyTakeaway, frameworkTags]) =>
    `  ${id}: {\n` +
    `    difficulty: "${difficulty}",\n` +
    `    keyTakeaway:\n` +
    `      ${JSON.stringify(keyTakeaway)},\n` +
    `    frameworkTags: [${frameworkTags.map((t) => `"${t}"`).join(", ")}],\n` +
    `  },`,
).join("\n");

const source = readFileSync(FILE, "utf8");
const close = source.lastIndexOf("};");
if (close === -1) throw new Error("could not find the closing brace of the map");
if (source.includes("\n  51: {")) throw new Error("batch 2 already applied");

writeFileSync(FILE, `${source.slice(0, close)}${block}\n${source.slice(close)}`);
console.log(`appended enrichment for ${ENTRIES.length} questions`);
