import type { QuestionEnrichment } from "@/content/types";

/**
 * Editorial metadata for the AIGP Preparation track, keyed by source question id.
 *
 * Why this file exists: `questions.json` is the canonical content and is checked
 * in exactly as authored, so no question, option, or rationale is ever altered.
 * The data model additionally requires `difficulty`, `key_takeaway`, and
 * `framework_tags`. Those are supplied here as a separate layer:
 *
 *  - difficulty      classification of the existing item (foundational /
 *                    applied / advanced), based on whether it tests a
 *                    definition, a situated judgement, or a multi-control
 *                    design decision.
 *  - keyTakeaway     the item's own rationale restated as a portable rule the
 *                    learner can carry to a new situation. Adds no new claim.
 *  - frameworkTags   mapping onto the controlled vocabulary in content/types.
 */
export const AIGP_ENRICHMENT: Record<number, QuestionEnrichment> = {
  1: {
    difficulty: "foundational",
    keyTakeaway:
      "Non-determinism is what separates AI governance from software governance. If identical inputs can yield different outputs, you need monitoring and evaluation controls that traditional software never required.",
    frameworkTags: ["AI Governance", "Responsible AI"],
  },
  2: {
    difficulty: "foundational",
    keyTakeaway:
      "Human-centric design means AI augments human judgment rather than replacing it. In high-stakes domains, a qualified human keeps final authority over the decision.",
    frameworkTags: ["Responsible AI"],
  },
  3: {
    difficulty: "foundational",
    keyTakeaway:
      "A governance body sees only the risks its members can see. Cross-functional composition — clinical, privacy, compliance, engineering — is what closes the blind spots.",
    frameworkTags: ["AI Governance"],
  },
  4: {
    difficulty: "applied",
    keyTakeaway:
      "Systems affecting access to essential services fall into the EU AI Act's high-risk tier, which triggers conformity assessment and transparency obligations.",
    frameworkTags: ["EU AI Act", "AI Risk Management"],
  },
  5: {
    difficulty: "foundational",
    keyTakeaway:
      "Govern is the foundation of the NIST AI RMF. Without the culture, policy, and accountability it establishes, Map, Measure, and Manage have nothing to operate within.",
    frameworkTags: ["NIST AI RMF"],
  },
  6: {
    difficulty: "applied",
    keyTakeaway:
      "AI systems do not operate in a legal vacuum. When PHI is involved, existing health privacy law applies in full alongside any AI-specific requirements.",
    frameworkTags: ["AI Governance"],
  },
  7: {
    difficulty: "foundational",
    keyTakeaway:
      "ISO/IEC 42001 is the certifiable AI management system standard. Reach for it when you need externally verifiable assurance rather than internal methodology.",
    frameworkTags: ["ISO 42001"],
  },
  8: {
    difficulty: "applied",
    keyTakeaway:
      "Impact assessment belongs before training data is touched. It is the proactive tool for identifying who could be harmed while the design can still change.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
  },
  9: {
    difficulty: "applied",
    keyTakeaway:
      "Removing a protected attribute does not remove bias. Correlated features act as proxies, so examine what a predictive feature is actually standing in for.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
  },
  10: {
    difficulty: "foundational",
    keyTakeaway:
      "A model card exists so someone who did not build the system can decide whether to rely on it — intended use, performance, limitations, and ethical considerations in one standard place.",
    frameworkTags: ["Responsible AI", "AI Governance"],
  },
  11: {
    difficulty: "applied",
    keyTakeaway:
      "Differential privacy bounds the influence of any single record through calibrated noise, giving a formal mathematical guarantee rather than a procedural assurance.",
    frameworkTags: ["Responsible AI"],
  },
  12: {
    difficulty: "applied",
    keyTakeaway:
      "Combining datasets creates re-identification risk that neither dataset carried alone. De-identified is not the same as non-identifiable once linkage is possible.",
    frameworkTags: ["AI Risk Management"],
  },
  13: {
    difficulty: "applied",
    keyTakeaway:
      "Performance that degrades after a clean launch usually points to drift — either the inputs have shifted or the relationship the model learned no longer holds.",
    frameworkTags: ["AI Risk Management", "NIST AI RMF"],
  },
  14: {
    difficulty: "applied",
    keyTakeaway:
      "You cannot govern what you cannot see. Contract for access to performance and monitoring data before signature, because leverage disappears afterwards.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  15: {
    difficulty: "applied",
    keyTakeaway:
      "The first move on a suspected disparate-outcome finding is notification and scope assessment — you need to know how far it reaches before choosing a remedy.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
  },
  16: {
    difficulty: "applied",
    keyTakeaway:
      "Identity disclosure is the most direct transparency control in a voice workflow. It sets accurate expectations and addresses the impersonation risk head-on.",
    frameworkTags: ["Responsible AI", "EU AI Act"],
  },
  17: {
    difficulty: "applied",
    keyTakeaway:
      "When a request falls outside the system's authorized scope, escalate to a qualified human. Answering anyway is the failure mode, especially in clinical contexts.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
  },
  18: {
    difficulty: "advanced",
    keyTakeaway:
      "Operational metrics will not catch a policy violation. Monitoring must include qualitative review of what the system actually said, not only how fast it said it.",
    frameworkTags: ["AI Risk Management", "NIST AI RMF"],
  },
  19: {
    difficulty: "advanced",
    keyTakeaway:
      "Disclose before information is collected, not after. Transparency that arrives once the member has already shared PHI cannot inform the decision it exists to support.",
    frameworkTags: ["Responsible AI", "EU AI Act"],
    visualAid: {
      type: "workflow",
      src: "/visual-aids/disclosure-before-phi-workflow.png",
      alt: "A member on a mobile device interacts with an AI voice agent. A missing-disclosure warning sits between the interaction and a protected health information record, which then flows to the payer server — showing PHI being collected before the member was told the agent was automated.",
      caption:
        "The sequence the control exists to prevent: information is collected before the member knows they are speaking to an automated system.",
    },
  },
  20: {
    difficulty: "advanced",
    keyTakeaway:
      "A pre-data gate enforces required disclosure and authorization before the system may touch or reveal sensitive information — a control in the flow, not a policy on paper.",
    frameworkTags: ["AI Governance", "Responsible AI"],
  },
  21: {
    difficulty: "applied",
    keyTakeaway:
      "In regulated settings, transparency and escalation control beat human-likeness. A more convincing agent that conceals its nature is a liability, not a feature.",
    frameworkTags: ["Responsible AI", "AI Governance"],
  },
  22: {
    difficulty: "applied",
    keyTakeaway:
      "Auditability means the critical actions can be reconstructed later — logged, protected, retained appropriately, and reachable by the people who provide oversight.",
    frameworkTags: ["AI Governance", "EU AI Act"],
  },
  23: {
    difficulty: "foundational",
    keyTakeaway:
      "Defined escalation rules are how human oversight becomes operational. Without a routing rule, oversight is an intention rather than a control.",
    frameworkTags: ["Responsible AI"],
  },
  24: {
    difficulty: "applied",
    keyTakeaway:
      "Evaluate vendors on governance capability — disclosure, auditability, policy enforcement, escalation — before commercial or aesthetic features, when sensitive data is in scope.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  25: {
    difficulty: "advanced",
    keyTakeaway:
      "A transparency control that stops working is a governance incident. Investigate it, remediate it, and assess who was affected while it was failing.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
  },
  26: {
    difficulty: "foundational",
    keyTakeaway:
      "Drift is the real world moving away from what the model learned. The model did not change; the conditions it was validated against did.",
    frameworkTags: ["AI Risk Management"],
  },
  27: {
    difficulty: "applied",
    keyTakeaway:
      "Where automated decisions carry legal or similarly significant effects, data protection law grants rights to human intervention and to contest the outcome.",
    frameworkTags: ["AI Governance"],
  },
  28: {
    difficulty: "foundational",
    keyTakeaway:
      "An impact assessment is forward-looking: who could be affected, what harms could occur, and what mitigations are needed — decided while there is still time to change course.",
    frameworkTags: ["AI Risk Management"],
  },
  29: {
    difficulty: "applied",
    keyTakeaway:
      "Serious incidents involving high-risk systems carry formal notification duties on a defined timeline. Reporting is triggered by the incident, not by the conclusion of root cause analysis.",
    frameworkTags: ["EU AI Act"],
  },
  30: {
    difficulty: "foundational",
    keyTakeaway:
      "Establishing why AI is being used, and assessing its impact, are design-phase activities. Deferring them to testing means the expensive decisions are already made.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  31: {
    difficulty: "applied",
    keyTakeaway:
      "Retrieval grounds generation in trusted sources, which reduces fabrication and makes answers checkable against something.",
    frameworkTags: ["Responsible AI"],
  },
  32: {
    difficulty: "foundational",
    keyTakeaway:
      "Transparency and explainability are about whether the people who need to understand a system's inputs, outputs, and logic actually can.",
    frameworkTags: ["Responsible AI"],
  },
  33: {
    difficulty: "advanced",
    keyTakeaway:
      "Scope control needs defense in depth: explicit instruction, boundary-case testing, and escalation when the boundary is approached. One layer alone will leak.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
  },
  34: {
    difficulty: "applied",
    keyTakeaway:
      "NIST ARIA is the evaluation-and-testing programme for assessing AI risks and impacts in practice, distinct from the risk framework itself.",
    frameworkTags: ["NIST AI RMF"],
  },
  35: {
    difficulty: "applied",
    keyTakeaway:
      "Synthetic data helps where real data is scarce or privacy exposure is high — provided its fidelity and limitations are validated rather than assumed.",
    frameworkTags: ["Responsible AI"],
  },
  36: {
    difficulty: "foundational",
    keyTakeaway:
      "Hallucination is fluent, confident, fabricated output. The danger is that its form is indistinguishable from a correct answer.",
    frameworkTags: ["Responsible AI"],
  },
  37: {
    difficulty: "foundational",
    keyTakeaway:
      "Accountability means it is clear who owns which decision across the lifecycle. Diffuse ownership is indistinguishable from no ownership when something goes wrong.",
    frameworkTags: ["AI Governance"],
  },
  38: {
    difficulty: "applied",
    keyTakeaway:
      "Red-teaming probes for the weaknesses ordinary testing is not designed to find. It asks how the system fails under pressure, not whether it works when used as intended.",
    frameworkTags: ["AI Risk Management", "NIST AI RMF"],
  },
  39: {
    difficulty: "applied",
    keyTakeaway:
      "AI used in employment decisions remains fully subject to existing civil-rights and nondiscrimination law, regardless of any AI-specific rules layered on top.",
    frameworkTags: ["AI Governance"],
  },
  40: {
    difficulty: "foundational",
    keyTakeaway:
      "Human-in-the-loop means a human retains meaningful review and decision authority — meaningful being the operative word, not merely present in the workflow.",
    frameworkTags: ["Responsible AI"],
  },
  41: {
    difficulty: "applied",
    keyTakeaway:
      "Fairness requires disaggregated outcomes across groups. An aggregate metric is an average that hides the population you most need to see.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
  },
  42: {
    difficulty: "applied",
    keyTakeaway:
      "Data lineage is the audit trail: where data came from, how it was processed, and whether it is still suitable for the use it is being put to.",
    frameworkTags: ["AI Governance", "ISO 42001"],
  },
  43: {
    difficulty: "applied",
    keyTakeaway:
      "Risk-based oversight means autonomy is granted per action, not per system. Routine actions proceed; higher-risk actions route to a human.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
  },
  44: {
    difficulty: "foundational",
    keyTakeaway:
      "Automation, reach, and probabilistic behaviour combine so that a single error propagates widely before anyone notices — which is why continuous monitoring is not optional.",
    frameworkTags: ["AI Risk Management"],
  },
  45: {
    difficulty: "advanced",
    keyTakeaway:
      "Responsibility splits along the value chain: the foundation model provider answers for pre-training data, while the deployer answers for its own data, tuning, and use in context.",
    frameworkTags: ["AI Governance", "EU AI Act"],
    visualAid: {
      type: "responsibility-map",
      src: "/visual-aids/value-chain-responsibility-map.png",
      alt: "Three columns dividing obligations across the AI value chain. Provider holds the model and its training documentation. Deployer holds the serving infrastructure, assurance, and operational checks. User is the person interacting with the deployed system.",
      caption:
        "Obligations follow control: each actor answers for the part of the chain they hold.",
    },
  },
  46: {
    difficulty: "foundational",
    keyTakeaway:
      "Mandatory identity disclosure is transparency made concrete — a specific control implementing a principle that would otherwise stay abstract.",
    frameworkTags: ["Responsible AI"],
  },
  47: {
    difficulty: "applied",
    keyTakeaway:
      "Conformity assessment is the formal verification that a high-risk system meets its obligations before it reaches the market — a gate, not a retrospective review.",
    frameworkTags: ["EU AI Act"],
  },
  48: {
    difficulty: "applied",
    keyTakeaway:
      "When the underlying facts change, retrieval sources must be updated and the change verified. The model is not wrong; its knowledge source is stale.",
    frameworkTags: ["AI Risk Management"],
  },
  49: {
    difficulty: "foundational",
    keyTakeaway:
      "AI governance layers onto existing privacy, security, and civil-rights obligations rather than replacing them. Integration, not substitution.",
    frameworkTags: ["AI Governance"],
  },
  50: {
    difficulty: "advanced",
    keyTakeaway:
      "Mature practice combines proactive disclosure, clear operational boundaries, human escalation for higher-risk situations, and auditability. Any one alone leaves a gap.",
    frameworkTags: ["Responsible AI", "AI Governance"],
  },
};
