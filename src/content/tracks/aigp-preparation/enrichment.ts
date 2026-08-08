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
    bokSubdomain: "I.A",
    difficulty: "foundational",
    keyTakeaway:
      "Non-determinism is what separates AI governance from software governance. If identical inputs can yield different outputs, you need monitoring and evaluation controls that traditional software never required.",
    frameworkTags: ["AI Governance", "Responsible AI"],
  },
  2: {
    bokSubdomain: "I.A",
    difficulty: "foundational",
    keyTakeaway:
      "Human-centric design means AI augments human judgment rather than replacing it. In high-stakes domains, a qualified human keeps final authority over the decision.",
    frameworkTags: ["Responsible AI"],
  },
  3: {
    bokSubdomain: "I.B",
    difficulty: "foundational",
    keyTakeaway:
      "A governance body sees only the risks its members can see. Cross-functional composition — clinical, privacy, compliance, engineering — is what closes the blind spots.",
    frameworkTags: ["AI Governance"],
  },
  4: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Systems affecting access to essential services fall into the EU AI Act's high-risk tier, which triggers conformity assessment and transparency obligations.",
    frameworkTags: ["EU AI Act", "AI Risk Management"],
  },
  5: {
    bokSubdomain: "II.D",
    difficulty: "foundational",
    keyTakeaway:
      "Govern is the foundation of the NIST AI RMF. Without the culture, policy, and accountability it establishes, Map, Measure, and Manage have nothing to operate within.",
    frameworkTags: ["NIST AI RMF"],
  },
  6: {
    bokSubdomain: "II.A",
    difficulty: "applied",
    keyTakeaway:
      "AI systems do not operate in a legal vacuum. When PHI is involved, existing health privacy law applies in full alongside any AI-specific requirements.",
    frameworkTags: ["AI Governance"],
  },
  7: {
    bokSubdomain: "II.D",
    difficulty: "foundational",
    keyTakeaway:
      "ISO/IEC 42001 is the certifiable AI management system standard. Reach for it when you need externally verifiable assurance rather than internal methodology.",
    frameworkTags: ["ISO 42001"],
  },
  8: {
    bokSubdomain: "III.A",
    difficulty: "applied",
    keyTakeaway:
      "Impact assessment belongs before training data is touched. It is the proactive tool for identifying who could be harmed while the design can still change.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
  },
  9: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "Removing a protected attribute does not remove bias. Correlated features act as proxies, so examine what a predictive feature is actually standing in for.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
  },
  10: {
    bokSubdomain: "III.C",
    difficulty: "foundational",
    keyTakeaway:
      "A model card exists so someone who did not build the system can decide whether to rely on it — intended use, performance, limitations, and ethical considerations in one standard place.",
    frameworkTags: ["Responsible AI", "AI Governance"],
  },
  11: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "When a privacy claim has to survive scrutiny, reach for differential privacy: calibrated noise bounds any single record's influence, so the guarantee is mathematical rather than a promise that the data was de-identified.",
    frameworkTags: ["Responsible AI"],
  },
  12: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "Combining datasets creates re-identification risk that neither dataset carried alone. De-identified is not the same as non-identifiable once linkage is possible.",
    frameworkTags: ["AI Risk Management"],
  },
  13: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "Performance that degrades after a clean launch usually points to drift — either the inputs have shifted or the relationship the model learned no longer holds.",
    frameworkTags: ["AI Risk Management", "NIST AI RMF"],
  },
  14: {
    bokSubdomain: "IV.B",
    difficulty: "applied",
    keyTakeaway:
      "You cannot govern what you cannot see. Contract for access to performance and monitoring data before signature, because leverage disappears afterwards.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  15: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "The first move on a suspected disparate-outcome finding is notification and scope assessment — you need to know how far it reaches before choosing a remedy.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
  },
  16: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "Identity disclosure is the most direct transparency control in a voice workflow. It sets accurate expectations and addresses the impersonation risk head-on.",
    frameworkTags: ["Responsible AI", "EU AI Act"],
  },
  17: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "When a request falls outside the system's authorized scope, escalate to a qualified human. Answering anyway is the failure mode, especially in clinical contexts.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
  },
  18: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "Operational metrics will not catch a policy violation. Monitoring must include qualitative review of what the system actually said, not only how fast it said it.",
    frameworkTags: ["AI Risk Management", "NIST AI RMF"],
  },
  19: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "Disclose before information is collected, not after. Transparency that arrives once the member has already shared PHI cannot inform the decision it exists to support.",
    frameworkTags: ["Responsible AI", "EU AI Act"],
    visualAid: {
      type: "workflow",
      src: "/visual-aids/disclosure-before-phi-workflow.webp",
      alt: "A member on a mobile device interacts with an AI voice agent. A missing-disclosure warning sits between the interaction and a protected health information record, which then flows to the payer server — showing PHI being collected before the member was told the agent was automated.",
      caption:
        "The sequence the control exists to prevent: information is collected before the member knows they are speaking to an automated system.",
    },
  },
  20: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "A pre-data gate enforces required disclosure and authorization before the system may touch or reveal sensitive information — a control in the flow, not a policy on paper.",
    frameworkTags: ["AI Governance", "Responsible AI"],
  },
  21: {
    bokSubdomain: "IV.B",
    difficulty: "applied",
    keyTakeaway:
      "In regulated settings, transparency and escalation control beat human-likeness. A more convincing agent that conceals its nature is a liability, not a feature.",
    frameworkTags: ["Responsible AI", "AI Governance"],
  },
  22: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "Specify what must be reconstructable before the system goes live — which actions are logged, how the logs are protected, how long they are kept, and who can reach them. Auditability left unspecified on any of those four points is not a control.",
    frameworkTags: ["AI Governance", "EU AI Act"],
  },
  23: {
    bokSubdomain: "IV.C",
    difficulty: "foundational",
    keyTakeaway:
      "Defined escalation rules are how human oversight becomes operational. Without a routing rule, oversight is an intention rather than a control.",
    frameworkTags: ["Responsible AI"],
  },
  24: {
    bokSubdomain: "IV.B",
    difficulty: "applied",
    keyTakeaway:
      "Evaluate vendors on governance capability — disclosure, auditability, policy enforcement, escalation — before commercial or aesthetic features, when sensitive data is in scope.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  25: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "A transparency control that stops working is a governance incident. Investigate it, remediate it, and assess who was affected while it was failing.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
  },
  26: {
    bokSubdomain: "III.C",
    difficulty: "foundational",
    keyTakeaway:
      "Drift is the real world moving away from what the model learned. The model did not change; the conditions it was validated against did.",
    frameworkTags: ["AI Risk Management"],
  },
  27: {
    bokSubdomain: "II.A",
    difficulty: "applied",
    keyTakeaway:
      "Where automated decisions carry legal or similarly significant effects, data protection law grants rights to human intervention and to contest the outcome.",
    frameworkTags: ["AI Governance"],
  },
  28: {
    bokSubdomain: "III.A",
    difficulty: "foundational",
    keyTakeaway:
      "An impact assessment is forward-looking: who could be affected, what harms could occur, and what mitigations are needed — decided while there is still time to change course.",
    frameworkTags: ["AI Risk Management"],
  },
  29: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Serious incidents involving high-risk systems carry formal notification duties on a defined timeline. Reporting is triggered by the incident, not by the conclusion of root cause analysis.",
    frameworkTags: ["EU AI Act"],
  },
  30: {
    bokSubdomain: "III.A",
    difficulty: "foundational",
    keyTakeaway:
      "Establishing why AI is being used, and assessing its impact, are design-phase activities. Deferring them to testing means the expensive decisions are already made.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  31: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Reach for retrieval when answers have to be checkable against something. Grounding generation in trusted sources is what turns a fluent answer into one a reviewer can verify.",
    frameworkTags: ["Responsible AI"],
  },
  32: {
    bokSubdomain: "I.A",
    difficulty: "foundational",
    keyTakeaway:
      "Transparency and explainability are about whether the people who need to understand a system's inputs, outputs, and logic actually can.",
    frameworkTags: ["Responsible AI"],
  },
  33: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "Scope control needs defense in depth: explicit instruction, boundary-case testing, and escalation when the boundary is approached. One layer alone will leak.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
  },
  34: {
    bokSubdomain: "II.D",
    difficulty: "applied",
    keyTakeaway:
      "NIST ARIA is the evaluation-and-testing programme for assessing AI risks and impacts in practice, distinct from the risk framework itself.",
    frameworkTags: ["NIST AI RMF"],
  },
  35: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "Synthetic data helps where real data is scarce or privacy exposure is high — provided its fidelity and limitations are validated rather than assumed.",
    frameworkTags: ["Responsible AI"],
  },
  36: {
    bokSubdomain: "I.A",
    difficulty: "foundational",
    keyTakeaway:
      "How confident the output sounds tells you nothing about whether it is right. A hallucination reads exactly like a correct answer, so detection has to come from grounding and review rather than from tone.",
    frameworkTags: ["Responsible AI"],
  },
  37: {
    bokSubdomain: "I.B",
    difficulty: "foundational",
    keyTakeaway:
      "Accountability means it is clear who owns which decision across the lifecycle. Diffuse ownership is indistinguishable from no ownership when something goes wrong.",
    frameworkTags: ["AI Governance"],
  },
  38: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "Red-teaming probes for the weaknesses ordinary testing is not designed to find. It asks how the system fails under pressure, not whether it works when used as intended.",
    frameworkTags: ["AI Risk Management", "NIST AI RMF"],
  },
  39: {
    bokSubdomain: "II.B",
    difficulty: "applied",
    keyTakeaway:
      "AI used in employment decisions remains fully subject to existing civil-rights and nondiscrimination law, regardless of any AI-specific rules layered on top.",
    frameworkTags: ["AI Governance"],
  },
  40: {
    bokSubdomain: "I.A",
    difficulty: "foundational",
    keyTakeaway:
      "Ask what the human can actually change. A reviewer who cannot overrule the output is oversight on paper — human-in-the-loop means meaningful review and decision authority.",
    frameworkTags: ["Responsible AI"],
  },
  41: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "Fairness requires disaggregated outcomes across groups. An aggregate metric is an average that hides the population you most need to see.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
  },
  42: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "Record lineage while the data is being assembled, not when someone asks for it. The question it answers later — is this data still suitable for this use — cannot be reconstructed after the fact.",
    frameworkTags: ["AI Governance", "ISO 42001"],
  },
  43: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "Risk-based oversight means autonomy is granted per action, not per system. Routine actions proceed; higher-risk actions route to a human.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
  },
  44: {
    bokSubdomain: "I.A",
    difficulty: "foundational",
    keyTakeaway:
      "Automation, reach, and probabilistic behaviour combine so that a single error propagates widely before anyone notices — which is why continuous monitoring is not optional.",
    frameworkTags: ["AI Risk Management"],
  },
  45: {
    bokSubdomain: "I.B",
    difficulty: "advanced",
    keyTakeaway:
      "Responsibility splits along the value chain: the foundation model provider answers for pre-training data, while the deployer answers for its own data, tuning, and use in context.",
    frameworkTags: ["AI Governance", "EU AI Act"],
    visualAid: {
      type: "responsibility-map",
      src: "/visual-aids/value-chain-responsibility-map.webp",
      alt: "Three columns dividing obligations across the AI value chain. Provider holds the model and its training documentation. Deployer holds the serving infrastructure, assurance, and operational checks. User is the person interacting with the deployed system.",
      caption:
        "Obligations follow control: each actor answers for the part of the chain they hold.",
    },
  },
  46: {
    bokSubdomain: "I.A",
    difficulty: "foundational",
    keyTakeaway:
      "To make a principle auditable, write it as a specific required action. A rule to be transparent cannot be checked; a rule that every call opens by disclosing the system is automated can.",
    frameworkTags: ["Responsible AI"],
  },
  47: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Conformity assessment is the formal verification that a high-risk system meets its obligations before it reaches the market — a gate, not a retrospective review.",
    frameworkTags: ["EU AI Act"],
  },
  48: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "When the underlying facts change, retrieval sources must be updated and the change verified. The model is not wrong; its knowledge source is stale.",
    frameworkTags: ["AI Risk Management"],
  },
  49: {
    bokSubdomain: "I.C",
    difficulty: "foundational",
    keyTakeaway:
      "AI governance layers onto existing privacy, security, and civil-rights obligations rather than replacing them. Integration, not substitution.",
    frameworkTags: ["AI Governance"],
  },
  50: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "Mature practice combines proactive disclosure, clear operational boundaries, human escalation for higher-risk situations, and auditability. Any one alone leaves a gap.",
    frameworkTags: ["Responsible AI", "AI Governance"],
  },
  51: {
    bokSubdomain: "I.A",
    difficulty: "foundational",
    keyTakeaway:
      "Non-determinism is the dividing line. If the same input can produce different outputs, reading the logic no longer tells you how the system behaves, and monitoring becomes a control rather than a nicety.",
    frameworkTags: ["AI Governance", "Responsible AI"],
  },
  52: {
    bokSubdomain: "I.A",
    difficulty: "foundational",
    keyTakeaway:
      "Explainability is about the person relying on the output, not the engineer who built it. If a decision-maker cannot state why the system ranked one option above another, the principle is not satisfied.",
    frameworkTags: ["Responsible AI"],
  },
  53: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "A governance body only sees the risks its members are trained to see. Single-function composition is itself a risk finding, regardless of how strong that function is.",
    frameworkTags: ["AI Governance"],
  },
  54: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "Deployer duties attach to operating a system in your own context, not to building it. You can owe governance obligations for a model you had no hand in training.",
    frameworkTags: ["AI Governance", "EU AI Act"],
  },
  55: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "Extend existing policy rather than replacing or ignoring it. The institutional maturity in a mature privacy policy is worth keeping; what it lacks is AI-specific coverage like provenance and drift.",
    frameworkTags: ["AI Governance"],
  },
  56: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "Pre-AI procurement questionnaires do not ask the questions AI risk turns on. Update the assessment and the contract before the purchase, not after the tool is in production.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  57: {
    bokSubdomain: "II.A",
    difficulty: "foundational",
    keyTakeaway:
      "Purpose limitation binds you to the purpose disclosed at collection. Repurposing existing data for a new AI feature is a privacy decision before it is a product decision.",
    frameworkTags: ["Responsible AI"],
  },
  58: {
    bokSubdomain: "II.A",
    difficulty: "applied",
    keyTakeaway:
      "Fully automated decisions with significant effects trigger specific duties, typically a route to human intervention and a way to contest. The trigger is the absence of human involvement, not the technology used.",
    frameworkTags: ["Responsible AI", "EU AI Act"],
  },
  59: {
    bokSubdomain: "II.B",
    difficulty: "foundational",
    keyTakeaway:
      "Training data is somebody's property. Copyright applies to what a model learns from, not only to what it produces.",
    frameworkTags: ["AI Governance"],
  },
  60: {
    bokSubdomain: "II.B",
    difficulty: "advanced",
    keyTakeaway:
      "Discrimination does not require the protected trait as an input. A neutral feature that correlates with it can produce the same outcome, which is why disparate impact is tested for rather than assumed away.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
  },
  61: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Risk tier follows the consequence for the person, not the sophistication of the tool. Anything gating access to employment sits high regardless of whether a human signs off.",
    frameworkTags: ["EU AI Act"],
  },
  62: {
    bokSubdomain: "II.C",
    difficulty: "advanced",
    keyTakeaway:
      "Model-level and use-case-level obligations stack rather than substitute. Building a general-purpose model does not exempt you because you cannot foresee downstream use.",
    frameworkTags: ["EU AI Act"],
  },
  63: {
    bokSubdomain: "II.D",
    difficulty: "foundational",
    keyTakeaway:
      "Govern, map, measure, manage identifies the NIST AI RMF — a voluntary framework, not binding law and not a certifiable standard.",
    frameworkTags: ["NIST AI RMF"],
  },
  64: {
    bokSubdomain: "II.D",
    difficulty: "foundational",
    keyTakeaway:
      "ISO/IEC 42001 is the certifiable one. If the goal is an audited certificate for an AI management system, that is the standard; the rest serve terminology, assessment, or voluntary risk work.",
    frameworkTags: ["ISO 42001"],
  },
  65: {
    bokSubdomain: "III.A",
    difficulty: "applied",
    keyTakeaway:
      "Undefined scope makes every later governance activity weaker. You cannot assess risk against a use case nobody has written down.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  66: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "Prioritise by severity and likelihood: eliminate, then reduce, then control, then accept with monitoring. Treating all risks equally and escalating everything are both ways of avoiding the judgement.",
    frameworkTags: ["AI Risk Management", "NIST AI RMF"],
  },
  67: {
    bokSubdomain: "III.A",
    difficulty: "applied",
    keyTakeaway:
      "Design documentation exists so you can defend a decision later, to a regulator or an affected person. Its value is proactive, and code comments do not substitute for it.",
    frameworkTags: ["AI Governance"],
  },
  68: {
    bokSubdomain: "III.B",
    difficulty: "foundational",
    keyTakeaway:
      "When training history cannot be reconstructed, the gap is lineage — not over-collection, over-retention, or portability. Naming the gap correctly matters, because each of those has a different fix.",
    frameworkTags: ["AI Governance"],
  },
  69: {
    bokSubdomain: "III.B",
    difficulty: "foundational",
    keyTakeaway:
      "Accuracy and fairness are separate properties tested separately. A model can be accurate overall and still disadvantage a group systematically.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
  },
  70: {
    bokSubdomain: "III.B",
    difficulty: "foundational",
    keyTakeaway:
      "Strong on training data, weak on new data means the model learned the sample rather than the pattern. Catching it is what a held-out test set is for.",
    frameworkTags: ["AI Risk Management"],
  },
  71: {
    bokSubdomain: "III.C",
    difficulty: "foundational",
    keyTakeaway:
      "Write intended use, limitations, and performance into a model card before release. The teams adopting the model then inherit its caveats instead of discovering them in production.",
    frameworkTags: ["Responsible AI"],
  },
  72: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "Accuracy decaying with no code change points to drift: the world moved, the model did not. The response is monitoring plus a retraining cadence, not a one-off fix.",
    frameworkTags: ["AI Risk Management", "NIST AI RMF"],
  },
  73: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "Transparency to a deployer means giving them what they need to operate safely — documentation, instructions, monitoring plans — not marketing material and not the raw training set.",
    frameworkTags: ["EU AI Act"],
  },
  74: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Readiness is a property of the people, not the model. A capable tool used by untrained staff is an unassessed risk.",
    frameworkTags: ["AI Governance", "Responsible AI"],
  },
  75: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Choose between open and proprietary models on how much visibility and control you need, not on licence. Neither choice changes which obligations apply — one you can inspect, the other you must take on the vendor's assurances.",
    frameworkTags: ["AI Governance"],
  },
  76: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Retrieval keeps answers current without retraining, by grounding them in approved sources at query time. It is the standard answer to content that changes faster than a training cycle.",
    frameworkTags: ["AI Governance"],
  },
  77: {
    bokSubdomain: "IV.B",
    difficulty: "applied",
    keyTakeaway:
      "Assess before you sign. Once the contract is executed, the leverage to change terms or walk away is gone.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
  },
  78: {
    bokSubdomain: "IV.B",
    difficulty: "advanced",
    keyTakeaway:
      "Contractual silence on liability is a finding, not a neutral fact. Resolve it by negotiation before signature rather than assuming it falls on the vendor.",
    frameworkTags: ["AI Governance"],
  },
  79: {
    bokSubdomain: "IV.B",
    difficulty: "advanced",
    keyTakeaway:
      "Building your own model adds developer obligations on top of deployer ones. More control means more responsibility, not less.",
    frameworkTags: ["AI Governance", "EU AI Act"],
  },
  80: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "Passing pre-deployment testing is a starting gate, not a finish line. Continuous monitoring and a retraining schedule are what keep a live system inside its tested envelope.",
    frameworkTags: ["NIST AI RMF", "AI Risk Management"],
  },
  81: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "Systems get used for things nobody assessed. Watching for secondary use is a standing deployment duty, because the original assessment does not cover the new use.",
    frameworkTags: ["AI Risk Management"],
  },
  82: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "Build the off switch before you need it. Being able to deactivate or localise a system per market is what lets you answer a regulator quickly without shutting down everywhere.",
    frameworkTags: ["AI Governance", "EU AI Act"],
  },
  83: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "Deploying a tool is not the same as building the capability to use it. Oversight is only real when the people acting on an output understand where it fails.",
    frameworkTags: ["AI Governance", "Responsible AI"],
  },
  84: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "Governance that cannot be staffed is not governance. Match the structure to the organisation's size, maturity and risk, or it will exist only on the org chart.",
    frameworkTags: ["AI Governance"],
  },
  85: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "When staff have already found a tool, the control that works is a clear rule about what may be used and with what data. Detection and disclaimers come after the rule, not instead of it.",
    frameworkTags: ["AI Governance", "Responsible AI"],
  },
  86: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "AI failures are rarely outages. If the incident policy only recognises breaches and downtime, a model quietly harming people has no escalation path at all.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  87: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "Standard procurement asks whether a supplier is sound. AI procurement also has to ask what the system was built from and what evidence exists that it works.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  88: {
    bokSubdomain: "I.C",
    difficulty: "advanced",
    keyTakeaway:
      "Before an AI-assisted deliverable reaches a client, know what the tool's licence lets you hand over. Ownership of output is a term you accepted, not a default you can assume.",
    frameworkTags: ["AI Governance"],
  },
  89: {
    bokSubdomain: "I.C",
    difficulty: "advanced",
    keyTakeaway:
      "Adopting AI does not mean rewriting the policy library. It means finding the specific policies whose assumptions no longer hold — data, suppliers, and incidents — and revising those.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  90: {
    bokSubdomain: "II.A",
    difficulty: "applied",
    keyTakeaway:
      "Ask what category the data falls into before asking what the system does with it. Biometric identifiers carry requirements that ordinary personal data does not.",
    frameworkTags: ["AI Governance"],
  },
  91: {
    bokSubdomain: "II.A",
    difficulty: "advanced",
    keyTakeaway:
      "An internal transfer is still a transfer. Moving training data across borders needs a lawful mechanism even when both ends of the pipeline belong to the same company.",
    frameworkTags: ["AI Governance"],
  },
  92: {
    bokSubdomain: "II.B",
    difficulty: "applied",
    keyTakeaway:
      "Marketing copy about AI capability is a regulated statement. If the system cannot do what the advertisement says, the exposure is deceptive practice, not engineering.",
    frameworkTags: ["AI Governance"],
  },
  93: {
    bokSubdomain: "II.B",
    difficulty: "advanced",
    keyTakeaway:
      "When an AI component is part of a physical product, a systematic failure is a design defect. Product liability applies to AI-enabled machinery exactly as it does to a faulty brake.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  94: {
    bokSubdomain: "II.B",
    difficulty: "applied",
    keyTakeaway:
      "Nondiscrimination law reaches housing decisions, not just hiring and lending. A neutral-looking input set that reproduces a protected characteristic is where the exposure sits.",
    frameworkTags: ["AI Governance", "Responsible AI"],
  },
  95: {
    bokSubdomain: "II.C",
    difficulty: "advanced",
    keyTakeaway:
      "The top tier of a risk framework is not the strictest set of controls — it is the line past which no controls help. Check whether a use is prohibited before designing its assessment.",
    frameworkTags: ["EU AI Act", "AI Risk Management"],
  },
  96: {
    bokSubdomain: "II.C",
    difficulty: "advanced",
    keyTakeaway:
      "Selling something you did not build is still a regulated role. Importers and distributors owe verification duties of their own, short of the provider's full obligations.",
    frameworkTags: ["EU AI Act"],
  },
  97: {
    bokSubdomain: "II.C",
    difficulty: "advanced",
    keyTakeaway:
      "Pre-market obligations for a high-risk system are about demonstrable process — assessed conformity, documentation that stands up, and risk management that runs throughout. They are not satisfied by disclosure or by unrelated certifications.",
    frameworkTags: ["EU AI Act", "AI Risk Management"],
  },
  98: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "Decide what good looks like before the model exists. A threshold chosen after seeing the output is a description of the model, not a standard it had to meet.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
  },
  99: {
    bokSubdomain: "III.A",
    difficulty: "applied",
    keyTakeaway:
      "The people closest to a decision know how it goes wrong. Engaging them during design is what turns a technically sound system into one that works on real cases.",
    frameworkTags: ["Responsible AI", "AI Governance"],
  },
  100: {
    bokSubdomain: "III.C",
    difficulty: "advanced",
    keyTakeaway:
      "A release gate is a set of criteria agreed before anyone wants to ship. If the only question at the gate is whether the model looks good, it is a formality rather than a control.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
  },
  101: {
    bokSubdomain: "III.C",
    difficulty: "advanced",
    keyTakeaway:
      "A model that retrains on user behaviour can be taught by users. Security assessment has to cover the pipeline that feeds the model, not just the answers it returns.",
    frameworkTags: ["AI Risk Management", "NIST AI RMF"],
  },
  102: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "Fixing the fault closes the incident. Understanding why nothing caught it is what stops the next one, and it needs the people outside engineering who saw the effects.",
    frameworkTags: ["AI Risk Management", "NIST AI RMF"],
  },
  103: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "Noticing is not monitoring. Without thresholds and a retraining schedule agreed in advance, degradation is discovered by whoever is affected by it.",
    frameworkTags: ["AI Risk Management", "NIST AI RMF"],
  },
  104: {
    bokSubdomain: "IV.A",
    difficulty: "advanced",
    keyTakeaway:
      "Work out where the data is allowed to be before choosing a model. A hosting constraint decides the deployment option, and no amount of review compensates for sending material somewhere it may not go.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  105: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Match the model type to the problem. Generative capability is not a general upgrade, and on a structured task it trades away the explainability a regulated decision needs.",
    frameworkTags: ["AI Governance", "Responsible AI"],
  },
  106: {
    bokSubdomain: "IV.A",
    difficulty: "advanced",
    keyTakeaway:
      "How often the source changes decides the technique. Retrieval suits knowledge that moves; fine-tuning suits behaviour and format that stay put.",
    frameworkTags: ["AI Governance"],
  },
  107: {
    bokSubdomain: "IV.A",
    difficulty: "advanced",
    keyTakeaway:
      "The deployment decision turns on the use case, the data behind it, and the people who will operate it. Vendor attributes that describe the supplier rather than the system belong in procurement, not this decision.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
  },
  108: {
    bokSubdomain: "IV.B",
    difficulty: "advanced",
    keyTakeaway:
      "A vendor can tell you about the system. Only you can assess what it does to your users in your context — so review what they supply, then do your own.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
  },
  109: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "Monitoring gives you a signal, not a cause. Establish which of the candidate explanations is driving a shift before choosing a remedy — suspension, notification and retraining are all wrong answers to two of the three.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      B:
        "Suspension is a reasonable response to a confirmed model-driven disparity, but imposed before cause is known it withdraws credit from a region on the strength of an unexplained number.",
      C:
        "Notification obligations attach to findings, not to unexplained signals. Reporting a disparity the bank has not established is both premature and hard to withdraw.",
      D:
        "Retraining assumes the model is the cause. If the shift is applicant mix or marketing spend, retraining changes the model without touching what moved.",
    },
    sources: [
      "NIST AI RMF (Manage function: response to identified risks)",
      "ISO/IEC 42001 (performance evaluation and monitoring)",
    ],
  },
  110: {
    bokSubdomain: "III.A",
    difficulty: "applied",
    keyTakeaway:
      "Removing a protected attribute does not remove its information. Ask of each remaining feature whether it has a defensible causal link to the outcome — the one that does not is where the proxy hides.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      A:
        "Debt-to-income has a direct, well-understood relationship to repayment capacity and is standard in credit assessment.",
      B:
        "Length of credit history measures observation time. It can correlate with age, but it is also a recognised credit-risk factor with a defensible rationale.",
      D:
        "Employment tenure relates to income stability and is verified against payroll, so it is grounded rather than inferred.",
    },
    sources: [
      "NIST AI RMF (Measure: fairness and bias assessment)",
      "EU AI Act Art. 10 (data governance, examination for bias)",
    ],
  },
  111: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "A change of scope needs the authority that granted the original scope. The team funding the work and the team validating it both have a role, but neither decides what the organisation is willing to use a model for.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      A:
        "Model Risk Management validates and maintains the inventory. Validating a use is not the same as authorising it.",
      C:
        "Credit Products proposes and funds the change. A business approving its own scope extension removes the control rather than exercising it.",
      D:
        "Concentrating the decision in the chair replaces a cross-functional judgement with a single one, losing the perspectives the committee exists to combine.",
    },
    sources: [
      "ISO/IEC 42001 (roles, responsibilities and authorities)",
      "NIST AI RMF (Govern: accountability structures)",
    ],
  },
  112: {
    bokSubdomain: "III.C",
    difficulty: "advanced",
    keyTakeaway:
      "Validated on one population means validated on one population. Before a model crosses into a new population, re-validate it, write down the assumption that it transfers, and close whatever is still open on the use you already have.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      D:
        "A volume target is a business objective. It describes what the group wants from the expansion, not a condition that makes it safe.",
      E:
        "Removing the override would reduce human oversight at the moment the model is being applied to a population it has never been tested on.",
    },
    sources: [
      "ISO/IEC 42001 (change management; AI system impact assessment)",
      "NIST AI RMF (Map: context and intended use)",
    ],
  },
  113: {
    bokSubdomain: "IV.A",
    difficulty: "advanced",
    keyTakeaway:
      "Oversight is only real if disagreeing is as easy as agreeing. Asymmetric paperwork quietly converts a human control into a rubber stamp, and leaves no evidence of which one it was.",
    frameworkTags: ["Responsible AI", "AI Governance"],
    distractorNotes: {
      A:
        "Inventory requirements concern registration and metadata, not override rates. Nothing about 94% breaches an inventory rule.",
      C:
        "Nothing in the facts suggests a training gap, and better training would not fix an incentive that penalises only one of the two decisions.",
      D:
        "Full automation would remove the oversight rather than repair it, and the low override rate is evidence about the process, not about whether a human should be there.",
    },
    sources: [
      "EU AI Act Art. 14 (human oversight; ability to disregard or override)",
      "NIST AI RMF (Govern: human-AI configuration)",
    ],
  },
  114: {
    bokSubdomain: "IV.B",
    difficulty: "applied",
    keyTakeaway:
      "One observer's impression is a hypothesis. When you hold the data that would confirm or dissolve it, measure before you escalate, renegotiate, or change the process.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      A:
        "Asking a vendor to change a model on the strength of an anecdote spends limited leverage and presumes a cause not yet established.",
      C:
        "Suspension imposes a hiring cost across 40,000 applications a year before anyone has confirmed the pattern is real.",
      D:
        "A manual-review instruction mitigates the suspected effect while leaving the organisation unable to say whether it exists or how large it is.",
    },
    sources: [
      "NIST AI RMF (Measure: track identified risks over time)",
      "ISO/IEC 42001 (monitoring, measurement and analysis)",
    ],
  },
  115: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Triage AI by what a system decides, not by how it was purchased. A vendor policy keyed to spend category will keep routing consequential systems around governance review.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      A:
        "Legal was involved. The gap is that AI governance was not, and that follows from how the policy classifies rather than from anyone exceeding authority.",
      C:
        "An SLA covering uptime is a real gap for a hiring dependency, but it is a symptom of the tool never reaching AI review, not the cause.",
      D:
        "Training-data access is rarely obtainable from a vendor and would not have been the trigger for governance involvement.",
    },
    sources: [
      "ISO/IEC 42001 (supplier and third-party controls)",
      "NIST AI RMF (Govern: third-party risk; Map: system categorisation)",
    ],
  },
  116: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "Ask what the organisation is accountable for and cannot currently explain. Where you operate controls whose effects you cannot predict, documentation of those controls beats access you could not use.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Training data is almost never released by a vendor, and analysing it would demand capability and lawful basis Calderon does not have.",
      B:
        "Model weights are proprietary and, without the feature definitions, would not tell Calderon what its own configuration does.",
      D:
        "A security accreditation speaks to confidentiality and availability, not to how the ranking behaves or what the sliders change.",
    },
    sources: [
      "EU AI Act Art. 13 (instructions for use supplied to deployers)",
      "ISO/IEC 42001 (documented information)",
    ],
  },
  117: {
    bokSubdomain: "IV.A",
    difficulty: "advanced",
    keyTakeaway:
      "When a system moves to a new job family, ask two things: what regulated determination it now touches, and whether existing assurance evidence was scoped to the population it is moving to.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      C:
        "Per-applicant cost is a commercial input to the decision, not a governance consideration.",
      D:
        "Recruiter interface preference is a usability signal that says nothing about whether the extension is appropriate.",
      E:
        "Netherlands adoption is a jurisdictional question that arises whether or not the tool extends to drivers.",
    },
    sources: [
      "EU AI Act Annex III (employment, worker management)",
      "NIST AI RMF (Map: intended use and context of deployment)",
    ],
  },
  118: {
    bokSubdomain: "II.B",
    difficulty: "applied",
    keyTakeaway:
      "Recruitment filtering is a heightened-risk use, and the roles are fixed by function: the organisation putting the system on the market is the provider, the one using it under its own authority is the deployer. Deployer duties cannot be contracted back.",
    frameworkTags: ["EU AI Act"],
    distractorNotes: {
      B:
        "Provider obligations do sit with the vendor, but deployer obligations sit with Calderon and exist independently. Neither absorbs the other.",
      C:
        "Scope follows the use and the role, not headcount. A small site deploying a heightened-risk system is still deploying one.",
      D:
        "Where training occurred does not determine applicability; use within the jurisdiction does.",
    },
    sources: [
      "EU AI Act Annex III(4) (employment and worker management)",
      "EU AI Act Art. 3 (definitions: provider, deployer)",
      "EU AI Act Art. 26 (deployer obligations)",
    ],
  },
  119: {
    bokSubdomain: "III.C",
    difficulty: "advanced",
    keyTakeaway:
      "Rank findings by how they interact with the control that is supposed to catch them. A defect the control cannot see is more dangerous than a larger one it reliably catches.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
    distractorNotes: {
      A:
        "The 6% is the larger share, but an unsupported citation is exactly what the required check surfaces — the passage visibly fails to say what the answer claims.",
      C:
        "Every case was caught in one 400-item sample. That is evidence the control works at that rate, not a guarantee it catches the class of error it cannot see.",
      D:
        "A 6% unsupported-citation rate is a grounding and retrieval problem, not evidence that the underlying model is unfit for retrieval.",
    },
    sources: [
      "NIST AI RMF (Measure: evaluate effectiveness of controls)",
      "ISO/IEC 42001 (operational control and verification)",
    ],
  },
  120: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "Retention follows classification. When it is unresolved whether an artefact is part of a record, settle the classification first — guessing high and guessing low each create their own exposure.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      A:
        "Six-year retention of every query spreads personal data over a long window without an established basis, and over-retention is its own risk.",
      C:
        "The assistant plays no part in eligibility, but Legal's open question is whether an answer a caseworker relied on becomes part of the record anyway.",
      D:
        "Ceasing to log to avoid creating records inverts the obligation and destroys the evidence that made the pilot reviewable.",
      E:
        "The provider's API retention governs the provider's systems, not the department's records schedule.",
    },
    sources: [
      "ISO/IEC 42001 (documented information; retention)",
      "NIST AI RMF (Govern: policies and documentation)",
    ],
  },
  121: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Risk classification tracks what a system decides or influences, not who operates it or how carefully it is run. Good controls do not lower a classification; a different decision role does.",
    frameworkTags: ["EU AI Act", "AI Risk Management"],
    distractorNotes: {
      A:
        "Restricting use to staff is a sensible control, but an internal-only system that shaped eligibility would still warrant heightened treatment.",
      C:
        "Sourcing the index internally improves grounding. It does not change what the system is used to decide.",
      D:
        "Comprehensive logging is evidence for oversight, not a factor in how the use is classified.",
    },
    sources: [
      "EU AI Act Annex III(5) (access to essential public services and benefits)",
      "EU AI Act Art. 6 (classification rules)",
    ],
  },
  122: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "A public statement about AI use should answer three questions a member of the public can act on: what it is used for, who remains answerable, and how to complain. Model internals are not among them.",
    frameworkTags: ["Responsible AI", "AI Governance"],
    distractorNotes: {
      D:
        "The model's name and version give a resident nothing actionable and will be out of date within a release cycle.",
      E:
        "Pilot error rates are essential internal governance evidence, but published without the control that caught them they mislead more than they inform.",
    },
    sources: [
      "OECD AI Principles (transparency and explainability)",
      "NIST AI RMF (Govern: transparency and accountability)",
    ],
  },
  123: {
    bokSubdomain: "IV.B",
    difficulty: "advanced",
    keyTakeaway:
      "When you cannot control an upstream change, control your ability to detect it. A fixed evaluation set converts an invisible provider-side update into a movement in a number you own.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      A:
        "General-purpose providers do not offer version-freeze guarantees, and a contractual promise would not survive the next deprecation cycle.",
      C:
        "A larger review sample measures the same quantity more precisely. It does not tell the department when the underlying model changed.",
      D:
        "Self-hosting a commercial model is not available under the API terms and would transfer obligations the department is not resourced to hold.",
    },
    sources: [
      "NIST AI RMF (Measure: ongoing monitoring; Manage: third-party dependencies)",
      "ISO/IEC 42001 (change management)",
    ],
  },
  124: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "Ask how the label you are predicting came to exist. If someone already intervened on the outcome, the model learns a world that already includes the intervention.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
    distractorNotes: {
      A:
        "Access control matters for confidentiality but does not affect whether the label means what the team assumes.",
      C:
        "Ten years is ample volume. Volume does not repair a label whose meaning is confounded.",
      D:
        "Export format is an engineering convenience with no bearing on validity.",
    },
    sources: [
      "NIST AI RMF (Map: assumptions about data and context)",
      "EU AI Act Art. 10 (relevance and representativeness of data)",
    ],
  },
  125: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "Independence is structural. Ask who writes the reviewer's appraisal — no amount of documentation or scheduling substitutes for a reporting line that permits a failing verdict.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "Reusing the development split imports the same selection decisions and cannot surface what that split omitted.",
      C:
        "More detailed self-documentation improves the record while leaving the judgement with the same people.",
      D:
        "A schedule constrains when the verdict arrives, not who is free to give it.",
    },
    sources: [
      "ISO/IEC 42001 (internal audit; competence and objectivity)",
      "NIST AI RMF (Govern: independent review)",
    ],
  },
  126: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "Test performance that cannot be reproduced live usually means the training set contained information the model will not have at prediction time. Check when each feature actually becomes available.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      A:
        "Overfitting degrades generalisation broadly. It does not specifically explain a gap between retrospective and real-time data.",
      C:
        "Latency affects whether a prediction arrives in time, not whether it is accurate.",
      D:
        "Population shift is plausible in general but would not be explained by a feature's 40-day settlement window.",
    },
    sources: [
      "NIST AI RMF (Measure: validity and reliability)",
      "ISO/IEC 42001 (AI system verification)",
    ],
  },
  127: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "Write documentation for the person who inherits the system, not the person who built it. Tested conditions and stated limits are what let a future operator notice the world has moved.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Discarded architectures explain the development path. They do not help an operator decide whether the model still applies.",
      C:
        "Compute budget and training duration are cost and provenance facts, not operating guidance.",
      D:
        "Team biographies are attribution, not the information needed to operate the model safely.",
    },
    sources: [
      "EU AI Act Art. 11 and Annex IV (technical documentation)",
      "ISO/IEC 42001 (documented information)",
    ],
  },
  128: {
    bokSubdomain: "III.A",
    difficulty: "applied",
    keyTakeaway:
      "Synthetic data can only contain what its generator knows. Augmenting scarce examples with a generator trained on those same examples inherits their blind spots and reports false confidence.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      B:
        "Storage cost is trivial relative to the governance question and is not specific to synthetic data.",
      C:
        "There is no rule barring synthetic data from models operating on physical infrastructure.",
      D:
        "Data protection approval attaches to personal data. Equipment telemetry does not raise that requirement.",
    },
    sources: [
      "NIST AI RMF (Map: data provenance and representativeness)",
      "ISO/IEC 42001 (data for AI systems)",
    ],
  },
  129: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "An aggregate win can hide a segment loss. Ask for performance broken down along the dimensions the business actually operates on before agreeing to release.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      B:
        "Uptime shows the pilot ran. It says nothing about whether the forecasts were good.",
      C:
        "User endorsement measures satisfaction, which can be high while accuracy is uneven.",
      D:
        "An aggregate comparison is precisely the average that a disaggregated view exists to interrogate.",
    },
    sources: [
      "NIST AI RMF (Measure: disaggregated evaluation)",
      "ISO/IEC 42001 (performance evaluation)",
    ],
  },
  130: {
    bokSubdomain: "III.C",
    difficulty: "advanced",
    keyTakeaway:
      "Weigh red-team findings by severity and by how easily an ordinary user reaches them. A serious failure on a normal path outranks a severe one that needs a contrived prompt.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
    distractorNotes: {
      A:
        "Offensive output from adversarial prompting is a real finding, but the effort required to trigger it bounds who encounters it.",
      C:
        "Inconsistent tone is a quality defect with no confidentiality or safety consequence.",
      D:
        "Latency on a small share of long prompts is a performance issue, not a release blocker of this kind.",
    },
    sources: [
      "NIST AI RMF (Measure: TEVV, red-teaming)",
      "ISO/IEC 42001 (operational planning and control)",
    ],
  },
  131: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "An inventory exists so limited assurance effort lands where failure hurts most. Order review by consequence to customers and obligations, not by cost, age or internal popularity.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "Compute spend measures what a model costs to run, which is unrelated to what its failure would cost.",
      C:
        "Time since last refresh is a useful trigger but treats a trivial model and a critical one identically.",
      D:
        "Internal dependency counts measure reach inside the organisation rather than harm outside it.",
    },
    sources: [
      "ISO/IEC 42001 (AI system inventory; risk assessment)",
      "NIST AI RMF (Map: risk prioritisation)",
    ],
  },
  132: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "An unexplained predictive feature is a question, not a verdict. Find out what it is standing in for — the answer decides whether it is legitimate signal or a proxy.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      A:
        "Selecting on accuracy alone accepts an unexamined risk precisely where the consequences of a proxy are most serious.",
      C:
        "No rule bars unexplained features outright, and discarding reflexively throws away signal that may be legitimate.",
      D:
        "Omitting the feature from documentation conceals the one thing an independent reviewer most needs to see.",
    },
    sources: [
      "NIST AI RMF (Measure: bias assessment)",
      "EU AI Act Art. 10 (examination for possible biases)",
    ],
  },
  133: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "Open weights are not unrestricted use. Before fine-tuning, establish that the base model's licence permits the intended purpose and note what it requires downstream.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      B:
        "Publishing fine-tuned weights is a licence-specific requirement, not a general obligation.",
      C:
        "There is no general duty to register a fine-tuned model with the base developer.",
      D:
        "Retraining from scratch discards the purpose of fine-tuning and is not required to manage inherited behaviour.",
    },
    sources: [
      "ISO/IEC 42001 (third-party and supplier controls)",
      "NIST AI RMF (Govern: third-party software and data)",
    ],
  },
  134: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "Undisclosed provenance leaves two things unknowable at once: whether you may lawfully use the data, and who is actually represented in it. Both propagate into everything built on top.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      C:
        "Storage capacity is an infrastructure matter that has no relationship to provenance.",
      D:
        "Price at renewal is a commercial risk, not a governance one.",
      E:
        "Schema transformation is routine engineering work and is unaffected by how the data was collected.",
    },
    sources: [
      "EU AI Act Art. 10 (data governance and provenance)",
      "NIST AI RMF (Map: data provenance)",
      "ISO/IEC 42001 (data quality and lineage)",
    ],
  },
  135: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "When two legitimate objectives conflict, the deciding question is what the organisation has already committed to. A named harm settles the trade-off in advance; an unnamed one means the commitment is being made now.",
    frameworkTags: ["Responsible AI", "AI Governance"],
    distractorNotes: {
      A:
        "Recovery timeline informs how to sequence the change, not whether the concentration is a harm worth addressing.",
      C:
        "Competitor behaviour is a benchmark, not a standard. Widespread practice does not make a harm acceptable.",
      D:
        "Implementation cost affects how the fix is delivered, not whether it should be.",
    },
    sources: [
      "OECD AI Principles (human-centred values and fairness)",
      "NIST AI RMF (Govern: organisational risk tolerance and values)",
    ],
  },
  136: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "A vendor claim you cannot inspect is not evidence. Accountability for outcomes stays with the deployer, so ask for assurance proportionate to that — not for everything, and not for nothing.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Contractual responsibility for a claim does not transfer accountability for outcomes on the university's own students.",
      C:
        "Human review catches individual errors; it does not detect a systematic difference in who gets flagged in the first place.",
      D:
        "Withheld analysis is common and manageable. A summary under confidentiality, an independent attestation, or the university's own live monitoring would all serve.",
    },
    sources: [
      "ISO/IEC 42001 (supplier controls; verification of claims)",
      "NIST AI RMF (Govern: third-party assurance)",
    ],
  },
  137: {
    bokSubdomain: "IV.A",
    difficulty: "advanced",
    keyTakeaway:
      "Look for the control the organisation already has and the pipeline that fails to consult it. Connecting existing machinery usually beats adding new machinery.",
    frameworkTags: ["Responsible AI", "AI Governance"],
    distractorNotes: {
      A:
        "Turning off the signal for everyone discards the capability the tool was licensed for, when the issue is how flags are reviewed.",
      B:
        "Asking a student to disclose a disability at the point of accusation puts the burden on the person least able to carry it.",
      D:
        "Monitoring outcomes observes harm after it lands rather than preventing it, and a term is a long time to watch.",
    },
    sources: [
      "EU AI Act Art. 14 (human oversight)",
      "OECD AI Principles (inclusive growth, human-centred values)",
    ],
  },
  138: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "When a model is retrained on outcomes its own decisions shaped, it reads its choices back as evidence. Ask what produced the data before you learn from it.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      A:
        "Review capacity is an operational constraint, not the mechanism by which the loop distorts learning.",
      C:
        "Competitor sensitivity is a feature-weighting question and would not follow from including its own prior decisions.",
      D:
        "Weekly retraining is unremarkable. Frequency is not what makes this loop self-confirming.",
    },
    sources: [
      "NIST AI RMF (Map: assumptions; Measure: validity)",
      "ISO/IEC 42001 (data for AI systems)",
    ],
  },
  139: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "Effect, not intent. A model given no protected attribute can still distribute outcomes along one — ask whether the difference is material and whether a duty is owed.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      B:
        "Documenting the exclusion evidences process and says nothing about the outcome distribution it produced.",
      C:
        "Competitor practice is a benchmark, not a standard. Common conduct can still be unlawful or unfair.",
      D:
        "Customer awareness is a transparency question. It does not change who pays more.",
    },
    sources: [
      "NIST AI RMF (Measure: fairness and bias)",
      "OECD AI Principles (fairness)",
    ],
  },
  140: {
    bokSubdomain: "II.A",
    difficulty: "advanced",
    keyTakeaway:
      "Read a disclosure against what the system actually does, and against the strictest market it operates in. Silence about automation is the gap that matters.",
    frameworkTags: ["AI Governance", "EU AI Act"],
    distractorNotes: {
      C:
        "Feature weightings are not a standard disclosure obligation and would not help a customer act.",
      D:
        "Naming the technology supplier is not required and tells the customer nothing about the price they see.",
      E:
        "A volatility cap is a commercial commitment, not a disclosure obligation.",
    },
    sources: [
      "GDPR Art. 13-14 (information to be provided)",
      "OECD AI Principles (transparency)",
    ],
  },
  141: {
    bokSubdomain: "IV.A",
    difficulty: "advanced",
    keyTakeaway:
      "Automating an action does not move the duty; it moves who must be named. Decide whose authority the system acts under, and put that on the artifact the regulator inspects.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "Naming the engineering lead by default assigns accountability by convenience rather than by who holds the authority.",
      C:
        "A system identifier traces provenance. The requirement is an accountable person.",
      D:
        "Abandoning automation treats an evidencing problem as a prohibition. The duty is to show accountability, not to avoid automation.",
    },
    sources: [
      "EU AI Act Art. 14 (human oversight)",
      "ISO/IEC 42001 (roles, responsibilities and authorities)",
      "NIST AI RMF (Govern: accountability)",
    ],
  },
  142: {
    bokSubdomain: "III.C",
    difficulty: "advanced",
    keyTakeaway:
      "Ask what a metric can see. A count of caught errors measures the catching process as much as the system, and says nothing about the errors nobody looked for.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      A:
        "Pilot length is a fair caution, but it is weaker than a flaw in what the metric is capable of measuring.",
      C:
        "The 18% override rate belongs to a different system doing a different job, and is not a comparable denominator.",
      D:
        "Calling 1.5% high asserts a threshold the facts do not supply, and still accepts the flawed metric.",
    },
    sources: [
      "NIST AI RMF (Measure: evaluation validity)",
      "ISO/IEC 42001 (monitoring, measurement, analysis and evaluation)",
    ],
  },
  143: {
    bokSubdomain: "IV.B",
    difficulty: "advanced",
    keyTakeaway:
      "Group findings by cause, not by severity. A low-severity symptom and a high-severity one arising from the same defect are one risk, and one fix.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      A:
        "Not having occurred yet is not evidence of low exposure when the mechanism that would cause it is active and demonstrated.",
      C:
        "Both failures come from acting on stale availability data. A separate control would duplicate the same fix.",
      D:
        "Planner cancellation is precisely the control that already let 44 duplicates through.",
    },
    sources: [
      "NIST AI RMF (Manage: risk prioritisation)",
      "ISO/IEC 42001 (nonconformity and corrective action)",
    ],
  },
  144: {
    bokSubdomain: "III.C",
    difficulty: "advanced",
    keyTakeaway:
      "Separate controls that remove a cause from controls that widen the net for catching its effects. Only the first reduces exposure.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      C:
        "The ranking threshold governs which transformers are prioritised — a different system and a different failure.",
      D:
        "Post-issue review catches a bad order after the crew has it, which is detection rather than prevention.",
      E:
        "A longer cancellation window improves the odds of catching an error that has already been made.",
    },
    sources: [
      "NIST AI RMF (Manage: risk treatment)",
      "ISO/IEC 42001 (operational control)",
    ],
  },
  145: {
    bokSubdomain: "II.B",
    difficulty: "applied",
    keyTakeaway:
      "Provider status follows who defines the intended purpose and puts the system on the market under their own name. Substantial modification transfers the role.",
    frameworkTags: ["EU AI Act"],
    distractorNotes: {
      A:
        "The original developer does not retain obligations for a system whose purpose it no longer determines.",
      C:
        "Obligations follow defined roles; they are not apportioned by agreement between the parties.",
      D:
        "They attach on placing on the market, not at the first commercial sale.",
    },
    sources: [
      "EU AI Act Art. 25 (responsibilities along the value chain)",
      "EU AI Act Art. 3 (definitions)",
    ],
  },
  146: {
    bokSubdomain: "II.D",
    difficulty: "applied",
    keyTakeaway:
      "Management-system standards share a common structure, so AI governance extends what exists rather than duplicating it. What gets added is the AI-specific part.",
    frameworkTags: ["ISO 42001", "AI Governance"],
    distractorNotes: {
      A:
        "An AI management system addresses different concerns; it does not replace security management for the same assets.",
      C:
        "Separate parallel systems duplicate governance overhead the common structure exists to avoid.",
      D:
        "Security certification addresses confidentiality, integrity and availability, not AI-specific risks.",
      E:
        "AI governance is not scoped to personal data; it applies to AI systems regardless.",
    },
    sources: [
      "ISO/IEC 42001 (Annex SL harmonised structure)",
      "ISO/IEC 27001 (information security management)",
    ],
  },
  147: {
    bokSubdomain: "II.D",
    difficulty: "foundational",
    keyTakeaway:
      "Mapping establishes context, use and affected parties. Measuring quantifies. Managing decides what to do. Measuring before mapping gives precise answers about the wrong thing.",
    frameworkTags: ["NIST AI RMF"],
    distractorNotes: {
      A:
        "Selecting metrics is a measurement activity, which depends on the context mapping establishes.",
      C:
        "Running an evaluation is measurement.",
      D:
        "Deciding to accept, transfer or mitigate is management.",
    },
    sources: [
      "NIST AI RMF 1.0 (Govern, Map, Measure, Manage functions)",
    ],
  },
  148: {
    bokSubdomain: "II.A",
    difficulty: "applied",
    keyTakeaway:
      "One high baseline is cheaper to run and evidence than several divergent ones, and it prevents a system quietly crossing a border. Depart from it deliberately, with a reason recorded.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      B:
        "Per-jurisdiction minima multiply configurations and audit surface, and create a gap the moment a system is used across a border.",
      C:
        "Applying the looser standard everywhere accepts a known breach in the stricter market.",
      D:
        "Suspension forgoes the tool precisely where its use is most scrutinised, without addressing the requirement.",
    },
    sources: [
      "NIST AI RMF (Govern: legal and regulatory requirements)",
      "ISO/IEC 42001 (compliance obligations)",
    ],
  },
  149: {
    bokSubdomain: "II.A",
    difficulty: "applied",
    keyTakeaway:
      "Legitimate interests is the basis that carries a documented balancing test: identify the interest, show necessity, weigh it against rights and reasonable expectations.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      A:
        "Consent is a different lawful basis. Relying on legitimate interests means not relying on consent.",
      C:
        "Anonymisation would take the processing outside the regime rather than satisfy a basis within it.",
      D:
        "General prior registration of processing is not a GDPR requirement.",
    },
    sources: [
      "GDPR Art. 6(1)(f) (legitimate interests)",
      "GDPR Recital 47 (reasonable expectations)",
    ],
  },
  150: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Obligations follow what a system does to people, not what it is built from. Identical technology in two uses can carry very different duties.",
    frameworkTags: ["EU AI Act", "AI Risk Management"],
    distractorNotes: {
      A:
        "Sector regulation is a consequence of the same consequence-based reasoning, not the explanation for it.",
      C:
        "Data volume does not determine the level of obligation.",
      D:
        "Likelihood of scrutiny describes enforcement, not what is required.",
    },
    sources: [
      "EU AI Act Art. 6 and Annex III (classification by use)",
      "NIST AI RMF (Map: context and impact)",
    ],
  },
  151: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "Traceability is being able to reconstruct a decision. Interpretability is being able to follow why. A good audit log delivers the first and is often mistaken for the second.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Interpretability means the internal logic can be followed, which the facts explicitly rule out.",
      C:
        "Contestability is the ability to challenge an outcome. Traceability supports it without being it.",
      D:
        "Robustness concerns stable performance under varied conditions, not the completeness of the record.",
    },
    sources: [
      "NIST AI RMF (Measure: accountable and transparent)",
      "ISO/IEC 42001 (records and traceability)",
    ],
  },
  152: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "Fairness has several incompatible formalisations. An undefined commitment cannot be complied with, tested, or breached — say which notion applies to which use, and how it will be measured.",
    frameworkTags: ["Responsible AI", "AI Governance"],
    distractorNotes: {
      A:
        "Publication makes a principle visible without making it actionable.",
      C:
        "Training helps a defined principle travel and cannot supply the definition.",
      D:
        "Executive ownership assigns responsibility for something still unspecified.",
    },
    sources: [
      "OECD AI Principles (fairness)",
      "NIST AI RMF (Govern: policies and principles)",
    ],
  },
  153: {
    bokSubdomain: "I.C",
    difficulty: "advanced",
    keyTakeaway:
      "A committee is real when it can say no and when it contains the people who would notice a problem. Cadence, chair seniority and terms of reference are hygiene a paper committee also has.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      C:
        "Meeting cadence and minutes are process hygiene present in ineffective committees too.",
      D:
        "Chair seniority helps decisions stick and does not create the authority to stop work.",
      E:
        "Board-approved terms of reference describe authority on paper rather than demonstrating it.",
    },
    sources: [
      "ISO/IEC 42001 (leadership and commitment)",
      "NIST AI RMF (Govern: accountability structures)",
    ],
  },
  154: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "Placement decides whether an escalation survives being unwelcome. Ask whether the function depends on the teams it reviews.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      B:
        "Budget size affects resourcing, not whether a concern can be raised against the budget holder.",
      C:
        "Co-location aids working relationships and can weaken the distance independence needs.",
      D:
        "Benchmark headcount describes scale, not standing.",
    },
    sources: [
      "ISO/IEC 42001 (organisational roles and authorities)",
      "NIST AI RMF (Govern: independent oversight)",
    ],
  },
  155: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "An agent acts rather than advising, which removes the human step where review used to sit. Authorisation, scoping and reversibility become the primary controls.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "Parameter count affects capability and cost, not what the system is permitted to do.",
      C:
        "Output modality changes how results are read, not whether the system can act on them.",
      D:
        "Integration method is an engineering choice with no bearing on reach.",
    },
    sources: [
      "NIST AI RMF (Map: system autonomy and human-AI configuration)",
      "ISO/IEC 42001 (AI system impact assessment)",
    ],
  },
  156: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "When the costly case is rare, the average hides it. Report the rare class separately so the number carrying the risk is the one in front of the decision-maker.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      A:
        "Overall accuracy is dominated by the common case and can look excellent while the model fails the rare one.",
      C:
        "A larger test set makes a misleading average more precise.",
      D:
        "A baseline comparison inherits whatever blind spot the chosen metric has.",
    },
    sources: [
      "NIST AI RMF (Measure: appropriate metrics)",
      "ISO/IEC 42001 (performance evaluation)",
    ],
  },
  157: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "Fitness for use is the gap between what a model was tested for and the world it now runs in. Documentation has to state the original scope and its limits.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      A:
        "A notebook records how the model was produced, which is provenance rather than applicability.",
      C:
        "A dashboard shows the present without the standard against which to judge it.",
      D:
        "A commit log records development activity and answers no question about scope.",
    },
    sources: [
      "EU AI Act Annex IV (technical documentation)",
      "ISO/IEC 42001 (documented information)",
    ],
  },
  158: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "If the modelled quantity is not the quantity the business means, precision is irrelevant. Name the validity problem rather than its symptoms.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      A:
        "Poor documentation is likely how it happened and is not what is broken.",
      C:
        "Inconsistent labelling is a separate defect. Here the definition itself diverges.",
      D:
        "Thin consultation explains the cause without describing the fault.",
    },
    sources: [
      "NIST AI RMF (Measure: validity and reliability)",
      "ISO/IEC 42001 (AI system requirements)",
    ],
  },
  159: {
    bokSubdomain: "III.C",
    difficulty: "advanced",
    keyTakeaway:
      "One metric on one attribute is a narrow window. Disparities across other attributes, and at their intersections, routinely hide behind marginal parity.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      A:
        "Statistical parity is computationally trivial at any realistic applicant volume.",
      C:
        "Attribute availability is a practical obstacle to measuring, not a limitation of the measure.",
      D:
        "Parity applies whether or not a human reviews the output.",
    },
    sources: [
      "NIST AI RMF (Measure: disaggregated and intersectional evaluation)",
      "EU AI Act Art. 10 (bias examination)",
    ],
  },
  160: {
    bokSubdomain: "III.B",
    difficulty: "advanced",
    keyTakeaway:
      "An assessment earns its place by naming who bears the risk, arriving while the design can still change, and leaving a trace of what changed because of it.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      D:
        "An executive signature makes an assessment auditable. Ceremonial assessments are signed too.",
      E:
        "A peer-consistent template aids comparability and is equally present in a form-filling exercise.",
    },
    sources: [
      "ISO/IEC 42001 (AI system impact assessment)",
      "NIST AI RMF (Map: impacts to individuals and society)",
    ],
  },
  161: {
    bokSubdomain: "III.A",
    difficulty: "applied",
    keyTakeaway:
      "Match the treatment to the diagnosis. If the cause is representation, fix representation — everything else manages the appearance of the gap.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      A:
        "Post-processing can equalise a reported rate while leaving the model just as poorly informed about the subgroup.",
      C:
        "Disclosure is honest and changes nothing about the outcome.",
      D:
        "Restricting use excludes the underserved group, turning a performance problem into an access one.",
    },
    sources: [
      "EU AI Act Art. 10 (representativeness of data)",
      "NIST AI RMF (Measure and Manage: bias mitigation)",
    ],
  },
  162: {
    bokSubdomain: "IV.B",
    difficulty: "advanced",
    keyTakeaway:
      "Security incident processes trigger on something breaking. The characteristic AI incident is a system working as built and producing a harmful outcome — which no availability alarm raises.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      A:
        "A faster timeline speeds a process that never starts if nothing is recognised as an incident.",
      C:
        "An on-call rota staffs a response to incidents already declared.",
      D:
        "Ticketing integration routes incidents that have already been identified.",
    },
    sources: [
      "NIST AI RMF (Manage: incident response)",
      "ISO/IEC 42001 (nonconformity and corrective action)",
    ],
  },
  163: {
    bokSubdomain: "IV.B",
    difficulty: "advanced",
    keyTakeaway:
      "Stable accuracy today is reassurance, not a cause. A shifted input distribution means something changed upstream; until you know what, you cannot say performance will hold.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      A:
        "Declaring the shift benign skips the question of what caused it.",
      C:
        "Doubting the metric contradicts the evidence that it is currently stable.",
      D:
        "Retraining on an unexplained shift risks fitting the model to a pipeline defect.",
    },
    sources: [
      "NIST AI RMF (Measure: monitoring for drift)",
      "ISO/IEC 42001 (monitoring and measurement)",
    ],
  },
  164: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Order by reversibility. Data that has already left cannot be recalled; licensing exposure, quality and dependency can all be remediated later.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      A:
        "Licence exposure accrues but is remediable once identified.",
      C:
        "Tone inconsistency is a quality issue with no irreversible consequence.",
      D:
        "Dependency is a future risk and does not compound while unaddressed today.",
    },
    sources: [
      "NIST AI RMF (Govern: shadow AI and unapproved use)",
      "ISO/IEC 42001 (operational control)",
    ],
  },
  165: {
    bokSubdomain: "IV.A",
    difficulty: "advanced",
    keyTakeaway:
      "A human control mitigates only if the reviewer can reach a different answer and does so before the action lands. Missing either turns oversight into commentary.",
    frameworkTags: ["Responsible AI", "EU AI Act"],
    distractorNotes: {
      C:
        "Reviewers need the case in front of them, not the model's architecture. Technical depth is rarely the binding constraint.",
      D:
        "An audit log evidences that review happened without making it capable of changing anything.",
      E:
        "Volume matters for fatigue, but matching a pre-automation workload is not what makes the control sound.",
    },
    sources: [
      "EU AI Act Art. 14 (human oversight; ability to intervene)",
      "NIST AI RMF (Govern: human-AI configuration)",
    ],
  },
  166: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "Switching a model off does not end the obligations attached to what it decided. The ability to explain past decisions has to outlive the system.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      A:
        "Artifact archiving is standard practice and is generally remembered.",
      C:
        "Vendor notice is a commercial step in any decommissioning.",
      D:
        "Inventory hygiene is routine and does not address the retained explanation duty.",
    },
    sources: [
      "ISO/IEC 42001 (retirement and documented information)",
      "GDPR Art. 22 (contesting automated decisions)",
    ],
  },
  167: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Establish what a new capability does with your content before deciding. The answer determines whether disabling, accepting or escalating is proportionate.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "Disabling on reflex may remove a benign capability and tells you nothing about what has already happened.",
      C:
        "Accepting a change because the product was approved is how unreviewed capability enters an estate.",
      D:
        "Board escalation is disproportionate before anyone has established the facts.",
    },
    sources: [
      "ISO/IEC 42001 (supplier changes; change management)",
      "NIST AI RMF (Govern: third-party risk)",
    ],
  },
  168: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "An affected individual asks why this happened to me. That is a local question — the factors that drove their outcome, in language they can act on.",
    frameworkTags: ["Responsible AI", "AI Governance"],
    distractorNotes: {
      A:
        "Global feature importances describe average behaviour and may not explain any particular case.",
      C:
        "Architecture and hyperparameters serve researchers, not affected individuals.",
      D:
        "A confidence score reports certainty without giving a single reason.",
    },
    sources: [
      "GDPR Art. 22 and Recital 71 (meaningful information about the logic)",
      "OECD AI Principles (explainability)",
    ],
  },
  169: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "A model trained to predict past outcomes reproduces whatever produced them. If past decisions were unequal, fidelity to that history is the failure, not the goal.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      A:
        "More historical data supplies more of the same pattern.",
      C:
        "Architecture choice addresses variance, not the meaning of the labels.",
      D:
        "A recent holdout detects drift rather than inherited unfairness.",
    },
    sources: [
      "EU AI Act Art. 10 (examination for biases)",
      "NIST AI RMF (Map: historical and societal bias)",
    ],
  },
  170: {
    bokSubdomain: "III.A",
    difficulty: "applied",
    keyTakeaway:
      "Purpose limitation is a gate, not a downstream check. If the new use is incompatible with what people were told, no engineering makes the data usable.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      A:
        "Volume matters only once the use is permitted at all.",
      C:
        "Schema transformation is routine work that presumes the data may be used.",
      D:
        "Collection accuracy is a quality question that arises after lawfulness.",
    },
    sources: [
      "GDPR Art. 5(1)(b) (purpose limitation)",
      "GDPR Art. 6(4) (compatibility assessment)",
    ],
  },
  171: {
    bokSubdomain: "III.B",
    difficulty: "advanced",
    keyTakeaway:
      "Reproducibility means being able to produce the same model again. The two things most often missing are the exact data it saw and the exact conditions it ran under.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      C:
        "Redundant storage preserves the output rather than the ability to recreate it.",
      D:
        "The business case is governance context, not a reproduction input.",
      E:
        "A dashboard reports results and does not help regenerate them.",
    },
    sources: [
      "ISO/IEC 42001 (documented information; traceability)",
      "NIST AI RMF (Measure: reproducibility)",
    ],
  },
  172: {
    bokSubdomain: "I.A",
    difficulty: "applied",
    keyTakeaway:
      "Conventional risk management assumes a system does what it was specified to do until it breaks. AI systems drift, and produce harms no existing control watches for.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "Magnitude is arguable and does not identify what existing controls fail to observe.",
      C:
        "No regime requires a structurally separate programme with separate reporting.",
      D:
        "Expertise can be added to a function that is still monitoring the wrong signals.",
    },
    sources: [
      "NIST AI RMF (Govern: integrating AI risk into enterprise risk management)",
      "ISO/IEC 42001 (context of the organisation)",
    ],
  },
  173: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Classification is a judgement about a system in a use, and it expires when the use changes. Re-run it on change rather than treating it as a permanent property.",
    frameworkTags: ["EU AI Act", "AI Risk Management"],
    distractorNotes: {
      B:
        "Inflating every classification wastes assurance capacity on systems that do not need it.",
      C:
        "An external assessor does not make a stale classification current.",
      D:
        "The mechanism works; it was applied once and never revisited.",
    },
    sources: [
      "EU AI Act Art. 6 (classification rules)",
      "ISO/IEC 42001 (change management)",
    ],
  },
  174: {
    bokSubdomain: "IV.B",
    difficulty: "advanced",
    keyTakeaway:
      "Stop accrual before repairing what has accrued. While the system keeps deciding, the affected population and the remediation scope both keep growing.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
    distractorNotes: {
      A:
        "Notification and redress are obligations that follow once the harm has stopped expanding.",
      C:
        "Retraining is the durable fix and takes time the affected customers do not have.",
      D:
        "Contractual cost recovery is commercial and affects no customer's experience.",
    },
    sources: [
      "NIST AI RMF (Manage: incident response and recovery)",
      "ISO/IEC 42001 (corrective action)",
    ],
  },
  175: {
    bokSubdomain: "I.C",
    difficulty: "advanced",
    keyTakeaway:
      "Measure whether the control is in the path of decisions. Systems shipping around the process is the characteristic failure, and coverage is what exposes it.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      A:
        "Inventory size measures how much exists, not whether any of it was reviewed.",
      C:
        "Training completion measures attendance.",
      D:
        "Policy count measures writing, and can rise while nothing changes.",
    },
    sources: [
      "ISO/IEC 42001 (performance evaluation; internal audit)",
      "NIST AI RMF (Govern: measuring programme effectiveness)",
    ],
  },
  176: {
    bokSubdomain: "IV.B",
    difficulty: "applied",
    keyTakeaway:
      "Dropping a protected attribute does not remove it from the model. When an unexplained disparity tracks an excluded feature, find the proxy carrying it before deciding anything else.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      B:
        "Commercial value is not in question and does not explain the disparity.",
      C:
        "A complaint threshold tells you when someone else will look, not what is happening.",
      D:
        "Feasibility of a remedy is premature while the mechanism is unknown.",
    },
    sources: [
      "NIST AI RMF (Measure: harmful bias and fairness)",
      "ISO/IEC 42001 (performance evaluation)",
    ],
  },
  177: {
    bokSubdomain: "III.C",
    difficulty: "advanced",
    keyTakeaway:
      "Monitoring tests the metrics you chose; validation tests whether those were the right metrics. Green dashboards are not evidence that revalidation can wait.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      A:
        "No general rule caps the validation interval at two years.",
      C:
        "Monitoring can detect population change; here it simply was not measuring for this.",
      D:
        "An annual trigger is a policy some firms adopt, not the reason this gap opened.",
    },
    sources: [
      "NIST AI RMF (Measure: TEVV throughout the lifecycle)",
      "ISO/IEC 42001 (monitoring, measurement, analysis and evaluation)",
    ],
  },
  178: {
    bokSubdomain: "I.C",
    difficulty: "advanced",
    keyTakeaway:
      "When two sound measurements point opposite ways, you have a trade-off, not a factual dispute. Trade-offs are resolved against a stated risk appetite, not by more data.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "Complaint clustering is measured evidence too; dismissing it as subjective is a preference, not a finding.",
      B:
        "A blanket priority rule replaces the judgement governance exists to make.",
      D:
        "Escalation without framing the trade-off moves the same open question upward.",
    },
    sources: [
      "NIST AI RMF (Govern: risk tolerance and trade-offs)",
      "ISO/IEC 42001 (risk criteria; management review)",
    ],
  },
  179: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Adding a third-party model changes what you have promised your own customers. Check the commitments already made before designing any remedy.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      B:
        "Renegotiating upstream presupposes knowing what was promised downstream.",
      C:
        "An opt-in is one possible remedy, chosen after the commitments are known.",
      D:
        "An assessment is a process step, not the gap the customer's questions reveal.",
    },
    sources: [
      "ISO/IEC 42001 (Annex A: suppliers and third parties)",
      "NIST AI RMF (Govern: third-party risks in the value chain)",
    ],
  },
  180: {
    bokSubdomain: "II.B",
    difficulty: "advanced",
    keyTakeaway:
      "In an AI value chain, obligations follow control and contract. You owe what you decided and what you promised; you do not inherit the developer's duties by embedding its model.",
    frameworkTags: ["EU AI Act", "AI Governance"],
    distractorNotes: {
      C:
        "Training-data disclosure sits with whoever developed and trained the model.",
      D:
        "Frontier systemic-risk evaluation attaches to the model provider, not the integrator.",
      E:
        "No general duty makes an integrator guarantee a model's output accuracy.",
    },
    sources: [
      "EU AI Act (obligations along the value chain; provider and deployer roles)",
      "NIST AI RMF (Govern: roles and responsibilities across the supply chain)",
    ],
  },
  181: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "A one-directional error gap concentrated in one group points at the training distribution. Random difficulty produces corrections in both directions.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
    distractorNotes: {
      A:
        "Leniency would not cluster in a single group in a single direction.",
      C:
        "Objectively harder responses would produce overrides running both ways.",
      D:
        "Override volume is the symptom being explained, not an explanation.",
    },
    sources: [
      "NIST AI RMF (Map: data representativeness; Measure: disaggregated evaluation)",
      "ISO/IEC 42001 (data quality for AI systems)",
    ],
  },
  182: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Governance scales with consequence, not with technology. The same model in a higher-stakes decision needs stronger evidence before you rely on it.",
    frameworkTags: ["EU AI Act", "AI Risk Management"],
    distractorNotes: {
      A:
        "Identical technology in a higher-stakes use is not an identical governance question.",
      C:
        "Raising the stakes does not transfer accountability to the vendor.",
      D:
        "Removing overrides would strip the control that surfaced the disparity.",
    },
    sources: [
      "EU AI Act (education as a high-risk use context)",
      "NIST AI RMF (Map: context of use and potential impacts)",
    ],
  },
  183: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "A vendor claim you can test cheaply is a hypothesis, not an assurance. Score a sample against your own ground truth before accepting or rejecting it.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      A:
        "Vendor visibility does not discharge the accountability that stays with the district.",
      C:
        "Overrides are the control already behaving unevenly; they cannot be the answer.",
      D:
        "Treating the claim as disqualifying forecloses a tool without evidence either way.",
    },
    sources: [
      "NIST AI RMF (Measure: independent validity evidence)",
      "ISO/IEC 42001 (Annex A: third-party and supplier assurance)",
    ],
  },
  184: {
    bokSubdomain: "I.A",
    difficulty: "applied",
    keyTakeaway:
      "Data governance is about the inputs. AI governance is about what the system does with them, and keeps doing after release.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      B:
        "Both are subject to regulation in various forms; the distinction is not voluntary versus mandatory.",
      C:
        "Ownership varies by organisation and does not explain what the two disciplines cover.",
      D:
        "AI governance builds on data governance rather than superseding it; the input controls are still required.",
    },
    sources: [
      "NIST AI RMF (Govern: integration with existing governance)",
      "ISO/IEC 42001 (context and scope)",
    ],
  },
  185: {
    bokSubdomain: "I.B",
    difficulty: "foundational",
    keyTakeaway:
      "A foundation model's governance problem is that its intended use is not settled when it is built. Downstream adaptation keeps moving it.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      B:
        "Inference cost varies enormously and small foundation models exist; cost is not the distinction.",
      C:
        "Foundation models produce images, audio, code and embeddings as well as text.",
      D:
        "Many are open-weight and run internally; access method is a commercial choice.",
    },
    sources: [
      "NIST AI RMF (Map: system characteristics)",
      "OECD AI Principles (general-purpose AI)",
    ],
  },
  186: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "Retrieval buys you a source to check against, not a guarantee of correctness. The index becomes a thing you now have to govern.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      B:
        "Retrieval sits outside the model; the weights are exactly as opaque as before.",
      C:
        "Grounded systems still misstate what a retrieved passage says, and can cite a superseded one.",
      D:
        "A retrieval index goes stale, which is an additional monitoring obligation rather than fewer.",
    },
    sources: [
      "NIST AI RMF (Measure: validity; Manage: monitoring)",
      "ISO/IEC 42001 (operational control)",
    ],
  },
  187: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "Ask where the policy sits in the path of a decision. A document nobody has to pass through changes nothing.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      A:
        "Scope definitions matter, but a well-scoped policy with no gate still stops nothing.",
      B:
        "A commitment sets tone and gives no one a reason to pause a launch.",
      D:
        "A regulatory inventory informs the policy without creating any decision point.",
    },
    sources: [
      "ISO/IEC 42001 (policy; operational planning and control)",
      "NIST AI RMF (Govern: policies and procedures)",
    ],
  },
  188: {
    bokSubdomain: "II.A",
    difficulty: "applied",
    keyTakeaway:
      "Automating a decision does not move it out of the law that already governed it. Discrimination law follows the outcome, not the method.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      B:
        "Trade secret protection concerns the vendor's interest in its model, not the employee's treatment.",
      C:
        "Disclosure duties to investors do not govern how a promotion decision is made.",
      D:
        "Contract law allocates risk between employer and vendor; the employee is not a party to it.",
    },
    sources: [
      "Title VII of the Civil Rights Act (US)",
      "NIST AI RMF (Govern: legal and regulatory requirements)",
    ],
  },
  189: {
    bokSubdomain: "II.A",
    difficulty: "advanced",
    keyTakeaway:
      "Reusing data for a new purpose is a lawfulness question first. Compatibility is the gate; security and accuracy are what happens after you pass it.",
    frameworkTags: ["AI Governance"],
    distractorNotes: {
      B:
        "Access control is a security requirement that applies once the processing is lawful.",
      C:
        "Commercial usefulness has no bearing on whether the reuse is permitted.",
      D:
        "Agent consent concerns the agents; the customers in the transcripts are the larger group at issue.",
    },
    sources: [
      "GDPR Art. 5(1)(b) (purpose limitation)",
      "GDPR Art. 6(4) (compatibility assessment)",
    ],
  },
  190: {
    bokSubdomain: "II.B",
    difficulty: "applied",
    keyTakeaway:
      "Classification follows consequence, not technology. The same model is a different regulatory object in a different use.",
    frameworkTags: ["EU AI Act", "AI Risk Management"],
    distractorNotes: {
      B:
        "Turnover affects some penalty calculations, not whether a use is heightened-risk.",
      C:
        "A simple model making consequential decisions is squarely in scope; complexity is irrelevant.",
      D:
        "Procurement changes which role you hold, not whether the use attracts obligations.",
    },
    sources: [
      "EU AI Act Art. 6 and Annex III (classification by use)",
      "NIST AI RMF (Map: context)",
    ],
  },
  191: {
    bokSubdomain: "II.B",
    difficulty: "advanced",
    keyTakeaway:
      "Logs exist to make an operation reconstructable after the fact. Anything else you do with them is a by-product.",
    frameworkTags: ["EU AI Act", "AI Governance"],
    distractorNotes: {
      B:
        "Reusing operational logs as training data raises its own purpose and lawfulness questions.",
      C:
        "Usage metering is a commercial function unrelated to the traceability duty.",
      D:
        "Fault diagnosis is useful but is not why record-keeping is required.",
    },
    sources: [
      "EU AI Act Art. 12 (record-keeping) and Art. 26 (deployer obligations)",
      "ISO/IEC 42001 (documented information)",
    ],
  },
  192: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Ask what the worst outcome is for the person. Not receiving a discretionary offer is a different order of harm from losing access to something.",
    frameworkTags: ["EU AI Act", "AI Risk Management"],
    distractorNotes: {
      B:
        "Almost all customer-facing systems process personal data to differentiate; that alone cannot be the test.",
      C:
        "Pricing effects matter, but a discretionary discount is not a denial of access or an adverse action.",
      D:
        "Risk-based frameworks classify all uses, including those that land in the lowest category.",
    },
    sources: [
      "EU AI Act Art. 6 (classification)",
      "NIST AI RMF (Map: impact assessment)",
    ],
  },
  193: {
    bokSubdomain: "II.D",
    difficulty: "applied",
    keyTakeaway:
      "A certificate says you run a managed process. It does not say you comply with any given law, and it never moves liability.",
    frameworkTags: ["ISO 42001", "AI Governance"],
    distractorNotes: {
      B:
        "No jurisdiction treats management-system certification as discharging substantive legal obligations.",
      C:
        "A legal register tracks obligations; certification does not enumerate or satisfy them.",
      D:
        "Liability stays with the organisation; a certification body attests, it does not indemnify.",
    },
    sources: [
      "ISO/IEC 42001 (scope; management system requirements)",
      "NIST AI RMF (Govern: compliance)",
    ],
  },
  194: {
    bokSubdomain: "II.D",
    difficulty: "foundational",
    keyTakeaway:
      "Outcome-based means you choose the how, not whether. The outcomes are the commitment; the practices are context.",
    frameworkTags: ["NIST AI RMF", "AI Governance"],
    distractorNotes: {
      B:
        "Choosing practices by cost rather than by whether they achieve the outcome is not adoption.",
      C:
        "Voluntary frameworks are widely referenced in supervisory expectations and contracts.",
      D:
        "Regulated organisations commonly use such frameworks to structure how they meet obligations.",
    },
    sources: [
      "NIST AI RMF 1.0 (framing and intended use)",
    ],
  },
  195: {
    bokSubdomain: "III.A",
    difficulty: "applied",
    keyTakeaway:
      "The cheapest, largest source quietly becomes the model's view of the world. Ask who is in it and how they got there.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
    distractorNotes: {
      B:
        "Training duration is a scheduling matter, not a property of what the model learns.",
      C:
        "Licensing cost affects the budget and not the model's behaviour.",
      D:
        "More data generally reduces overfitting; the problem here is composition, not volume.",
    },
    sources: [
      "EU AI Act Art. 10 (representativeness)",
      "NIST AI RMF (Map: data provenance)",
    ],
  },
  196: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "Representative of what? The benchmark is the population the system will act on, not any population that happens to be available.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      A:
        "National demographics are one possible benchmark and are the wrong one where the user base differs.",
      C:
        "Comparing a dataset to an intended population is a pre-training analysis, not a post-training one.",
      D:
        "Documentation records a decision; it does not make an inapt benchmark apt.",
    },
    sources: [
      "EU AI Act Art. 10(3) (relevance and representativeness)",
      "NIST AI RMF (Map: intended population)",
    ],
  },
  197: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "Reconstructing a decision needs version, input and configuration. Approval records tell you a decision was allowed, not what it was.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      B:
        "Minutes show the deployment was approved; they say nothing about a particular output.",
      C:
        "Marketing documentation describes intended capability rather than actual behaviour.",
      D:
        "Staffing records identify who built the system, not what it did on a given day.",
    },
    sources: [
      "EU AI Act Art. 12 (record-keeping)",
      "ISO/IEC 42001 (traceability of AI system decisions)",
    ],
  },
  198: {
    bokSubdomain: "III.B",
    difficulty: "advanced",
    keyTakeaway:
      "A model card goes stale in two directions. Date what you measured, and re-issue when the thing you described changes.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      C:
        "Tone review improves readability without preventing a claim from going out of date.",
      D:
        "Publishing principles alongside adds context, not currency.",
      E:
        "Translation widens the audience for whatever the card says, accurate or not.",
    },
    sources: [
      "ISO/IEC 42001 (documented information; control of documents)",
      "NIST AI RMF (Govern: transparency artefacts)",
    ],
  },
  199: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "A test suite is a list of the failures someone thought of. Passing it bounds what you checked, not what can happen.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      B:
        "Production differs from a test harness in inputs, load and context; equivalence does not follow.",
      C:
        "A clean pass carries no information about whether the test set was adequately sized.",
      D:
        "Training duration is unrelated to whether a designed test suite was comprehensive.",
    },
    sources: [
      "NIST AI RMF (Measure: TEVV limitations)",
      "ISO/IEC 42001 (verification and validation)",
    ],
  },
  200: {
    bokSubdomain: "III.C",
    difficulty: "advanced",
    keyTakeaway:
      "Fairness metrics genuinely conflict. Choosing between them means deciding whose error you are least willing to distribute unequally.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      A:
        "Equal accuracy is compatible with one group bearing far more of the costly error type.",
      C:
        "Divergence is expected; the measures are mathematically incompatible in general.",
      D:
        "A disparity on one measure requires interpretation against what that error costs, not an automatic verdict.",
    },
    sources: [
      "NIST AI RMF (Measure: fairness metrics and trade-offs)",
      "OECD AI Principles (fairness)",
    ],
  },
  201: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Size oversight by reversibility and cost of error, not by accuracy. Being right most of the time does not help if being wrong cannot be undone.",
    frameworkTags: ["Responsible AI", "EU AI Act"],
    distractorNotes: {
      B:
        "Accuracy affects how often oversight catches something, not how much is warranted.",
      C:
        "Available staffing is a constraint to solve for, not a determinant of what the risk needs.",
      D:
        "Team confidence is not evidence, and is systematically optimistic about one's own work.",
    },
    sources: [
      "EU AI Act Art. 14 (human oversight, proportionate to risk)",
      "NIST AI RMF (Govern: human-AI configuration)",
    ],
  },
  202: {
    bokSubdomain: "IV.A",
    difficulty: "advanced",
    keyTakeaway:
      "Contract for what you need to discharge duties you cannot delegate. Money after the fact does not let you answer for a decision.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      B:
        "An indemnity allocates cost after harm; it does not enable the deployer to meet its own obligations.",
      C:
        "Service credits address downtime, which is not the governance exposure here.",
      D:
        "Security certification speaks to confidentiality and availability, not to explaining a decision.",
    },
    sources: [
      "EU AI Act Art. 13 and Art. 26 (information to deployers; deployer duties)",
      "ISO/IEC 42001 (supplier controls)",
    ],
  },
  203: {
    bokSubdomain: "IV.B",
    difficulty: "applied",
    keyTakeaway:
      "Input drift is visible before outcomes arrive. Anything that needs labels tells you late, and by then the decisions are made.",
    frameworkTags: ["AI Risk Management"],
    distractorNotes: {
      B:
        "Complaints lag badly and only a small, unrepresentative fraction of affected users complain.",
      C:
        "Serving cost follows request volume and says nothing about output quality.",
      D:
        "Fewer overrides may indicate automation bias rather than a better model.",
    },
    sources: [
      "NIST AI RMF (Measure: monitoring for drift)",
      "ISO/IEC 42001 (monitoring and measurement)",
    ],
  },
  204: {
    bokSubdomain: "IV.B",
    difficulty: "advanced",
    keyTakeaway:
      "First hour: stop it, and find out how many. Everything else depends on knowing the answer to the second.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
    distractorNotes: {
      C:
        "Communications drafted before the facts are established are usually wrong and hard to retract.",
      D:
        "Retraining takes days or weeks and does nothing for the people already affected.",
      E:
        "Cost recovery is a commercial question with no bearing on the immediate response.",
    },
    sources: [
      "NIST AI RMF (Manage: incident response)",
      "ISO/IEC 42001 (nonconformity and corrective action)",
    ],
  },
  205: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "Ask what the reader can do differently having read it. A notice that changes nobody's options is a formality, not transparency.",
    frameworkTags: ["Responsible AI", "AI Governance"],
    distractorNotes: {
      B:
        "Timing matters, and an early notice that offers no action is still not meaningful.",
      C:
        "Regulatory terminology can be precise and still leave a reader with nothing to do.",
      D:
        "Acknowledgement records that a notice was shown, not that it was useful.",
    },
    sources: [
      "GDPR Art. 13-14 and Recital 71 (meaningful information)",
      "OECD AI Principles (transparency)",
    ],
  },
  206: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "The obligation is local and actionable: why this outcome, and what you can do about it. Global opacity is not an exemption.",
    frameworkTags: ["Responsible AI", "AI Governance"],
    distractorNotes: {
      B:
        "Local explanation methods work on ensembles; global opacity does not discharge the duty.",
      C:
        "Average importances may not describe this individual's outcome at all.",
      D:
        "A re-run produces another result, not an account of why either was reached.",
    },
    sources: [
      "GDPR Art. 22 and Recital 71 (contesting automated decisions)",
      "NIST AI RMF (Measure: explainability)",
    ],
  },
  207: {
    bokSubdomain: "I.A",
    difficulty: "foundational",
    keyTakeaway:
      "Degradation without any change to the model is drift: the world moved and the model did not. It is the reason AI needs ongoing monitoring where deterministic software needs none.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "Opacity would make the model hard to explain from day one, not gradually less accurate.",
      C:
        "Autonomy describes who authorises an output, not whether it stays right.",
      D:
        "Scale multiplies whatever the model does, well or badly, without changing over time.",
    },
    sources: [
      "NIST AI RMF (Measure: monitoring for performance change)",
      "ISO/IEC 42001 (monitoring and measurement)",
    ],
  },
  208: {
    bokSubdomain: "I.A",
    difficulty: "applied",
    keyTakeaway:
      "Scale and invisibility are what turn an AI mistake into an AI harm: the error repeats uniformly, and the people it lands on have no way to raise it.",
    frameworkTags: ["Responsible AI", "AI Governance"],
    distractorNotes: {
      C:
        "Cost affects whether a system is built, not how far its errors travel.",
      D:
        "Recruitment difficulty is an operational constraint, not a property of the harm.",
      E:
        "Implementation language is an auditing inconvenience, not a driver of spread.",
    },
    sources: [
      "OECD AI Principles (human-centred values; transparency)",
      "NIST AI RMF (Map: potential impacts and affected parties)",
    ],
  },
  209: {
    bokSubdomain: "I.A",
    difficulty: "applied",
    keyTakeaway:
      "The governance difference is the size of the output space. When you cannot enumerate what a system might say, you cannot test it exhaustively, so assurance moves to sampling and monitoring.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "Cost changes the business case, not what assurance has to prove.",
      C:
        "Novelty is temporary and says nothing about the structure of the risk.",
      D:
        "Training-data provenance varies by model and is not what makes output open-ended.",
    },
    sources: [
      "NIST AI RMF (Measure: TEVV for generative systems)",
      "ISO/IEC 42001 (Annex A: AI system impact assessment)",
    ],
  },
  210: {
    bokSubdomain: "I.A",
    difficulty: "advanced",
    keyTakeaway:
      "Scope governance by consequence, not by technique. A definitional boundary is something to argue about; an impact threshold is something to apply.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "A technical test makes the scope of the policy a matter for engineers to litigate.",
      C:
        "Excluding by architecture lets a high-impact decision escape review.",
      D:
        "Including everything automated buries the review process in trivia.",
    },
    sources: [
      "ISO/IEC 42001 (scope of the AI management system)",
      "NIST AI RMF (Map: context and intended purpose)",
    ],
  },
  211: {
    bokSubdomain: "I.A",
    difficulty: "foundational",
    keyTakeaway:
      "Aggregate accuracy conceals distribution. Fairness is a question about who bears the errors, which only disaggregated evaluation can answer.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      A:
        "Transparency concerns what is disclosed, not how errors are shared out.",
      C:
        "Robustness is about behaviour under perturbation, not across populations.",
      D:
        "Accountability is about who answers for the outcome, not its distribution.",
    },
    sources: [
      "NIST AI RMF (Measure: harmful bias; disaggregated metrics)",
      "OECD AI Principles (fairness)",
    ],
  },
  212: {
    bokSubdomain: "I.A",
    difficulty: "applied",
    keyTakeaway:
      "Buying a model does not outsource the deployment decision. Context of use is chosen by the deployer and is where most impact originates.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Hosting location is addressable in a contract and is not the core gap.",
      C:
        "Audit rights are a negotiation detail inside vendor management, not an argument against it.",
      D:
        "Whether buying raises total risk depends on what the alternative would have been.",
    },
    sources: [
      "NIST AI RMF (Govern: roles across the value chain)",
      "ISO/IEC 42001 (Annex A: use of AI systems supplied by others)",
    ],
  },
  213: {
    bokSubdomain: "I.A",
    difficulty: "advanced",
    keyTakeaway:
      "Low-stakes individual outputs can still produce high-stakes aggregate effects. Ask what the system optimises for and what it does cumulatively, not how consequential one output is.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      C:
        "Architecture does not determine whether the effects are significant.",
      D:
        "Pipeline documentation is a control, not evidence about impact.",
      E:
        "Latency is a performance target unrelated to the risk being disputed.",
    },
    sources: [
      "NIST AI RMF (Map: impacts beyond the individual decision)",
      "OECD AI Principles (human-centred values and wellbeing)",
    ],
  },
  214: {
    bokSubdomain: "I.A",
    difficulty: "applied",
    keyTakeaway:
      "Oversight is a capability, not a position. Ask whether the reviewer can reach a different answer, has what they need to reach it, and can make it stick.",
    frameworkTags: ["Responsible AI", "EU AI Act"],
    distractorNotes: {
      B:
        "More reviewers with no authority is the same control repeated.",
      C:
        "Employment status does not determine whether oversight is effective.",
      D:
        "Handling time is a symptom worth measuring, not the defining property.",
    },
    sources: [
      "EU AI Act (human oversight requirements for high-risk systems)",
      "NIST AI RMF (Manage: human-AI configuration)",
    ],
  },
  215: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "Whoever decides what is in scope decides what gets governed. Scoping criteria belong with the governance function, not with the teams being scoped.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      A:
        "Over-reporting is possible but runs against the incentive being described.",
      C:
        "Geography is not the variable driving the inconsistency here.",
      D:
        "Lost measurability follows from the gap rather than explaining it.",
    },
    sources: [
      "ISO/IEC 42001 (scope; roles, responsibilities and authorities)",
      "NIST AI RMF (Govern: accountability structures)",
    ],
  },
  216: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "A governance function sees the risks its expertise is trained to see. Assigning AI oversight to one discipline creates a blind spot in every other.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Independence is about conflicts of interest, not breadth of expertise.",
      C:
        "Standards do not prescribe who holds the role.",
      D:
        "Regulators do not read a single appointment as a resourcing finding.",
    },
    sources: [
      "ISO/IEC 42001 (roles, responsibilities and competence)",
      "NIST AI RMF (Govern: diverse expertise and perspectives)",
    ],
  },
  217: {
    bokSubdomain: "I.B",
    difficulty: "advanced",
    keyTakeaway:
      "A body that never says no is either upstream of nothing or downstream of everything. Test when it sees proposals and whether it can stop them before reading the record as good news.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      A:
        "That is the conclusion to be tested, not the one to start from.",
      C:
        "Cutting cadence acts on the symptom and reduces the chance of catching anything.",
      D:
        "A wider remit multiplies a review that may not be working.",
    },
    sources: [
      "ISO/IEC 42001 (management review; internal audit)",
      "NIST AI RMF (Govern: accountability and oversight effectiveness)",
    ],
  },
  218: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "Match training to the decision the person makes. Awareness content is for people who need to recognise AI; role training is for people who must judge it.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      C:
        "Staff who touch no AI system make no decision the training would inform.",
      D:
        "A board receiving an annual summary needs briefing, not operational training.",
      E:
        "Website use is not a decision about relying on a model's output.",
    },
    sources: [
      "ISO/IEC 42001 (competence and awareness)",
      "NIST AI RMF (Govern: workforce competency)",
    ],
  },
  219: {
    bokSubdomain: "I.B",
    difficulty: "advanced",
    keyTakeaway:
      "Your role follows what you did: modifying a model or putting it on the market under your own name makes you a provider, whatever you call yourself.",
    frameworkTags: ["EU AI Act", "AI Governance"],
    distractorNotes: {
      A:
        "Ordinary use of a third-party model does not by itself confer provider status.",
      C:
        "Where the system runs does not determine the regulatory role.",
      D:
        "Rebranding is exactly the kind of act that shifts the role.",
    },
    sources: [
      "EU AI Act (provider, deployer and substantial modification)",
      "NIST AI RMF (Govern: value chain roles)",
    ],
  },
  220: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "Measure whether the control is in the path of the work. Coverage catches systems shipping around the process; counts of artefacts do not.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      A:
        "Inventory size measures how much exists, not what was reviewed.",
      C:
        "Training completion measures attendance, not application.",
      D:
        "Policy count can rise while nothing about practice changes.",
    },
    sources: [
      "ISO/IEC 42001 (performance evaluation)",
      "NIST AI RMF (Govern: measuring programme effectiveness)",
    ],
  },
  221: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "Centralised governance buys consistency at the cost of context; embedded governance buys context at the cost of consistency. Hybrids exist because both costs are real.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      C:
        "An inventory is required under either model.",
      D:
        "Embedded governance still needs a written standard to be embedded against.",
      E:
        "Internal structure does not reallocate legal liability.",
    },
    sources: [
      "ISO/IEC 42001 (organisational roles and authorities)",
      "NIST AI RMF (Govern: organisational structures)",
    ],
  },
  222: {
    bokSubdomain: "I.B",
    difficulty: "applied",
    keyTakeaway:
      "Unmanaged tool use is a live data-out and code-in exposure. State the boundary first; refine quality, licensing and disclosure once one exists.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Output quality matters but does not stop confidential input leaving today.",
      C:
        "A licence negotiation takes months while the exposure continues.",
      D:
        "Disclosure is useful once there is a rule to disclose against.",
    },
    sources: [
      "ISO/IEC 42001 (Annex A: acceptable use of AI systems)",
      "NIST AI RMF (Govern: policies and procedures)",
    ],
  },
  223: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "A threshold nobody owns and nobody records is a setting, not a policy. Ownership and change history are what make a rule defensible.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      B:
        "A better detector still needs someone to decide what it should trigger.",
      C:
        "Legal advice tells Meridian what it must do, not who decides or how changes are recorded.",
      D:
        "An audit needs a stated rule to audit against.",
    },
    sources: [
      "ISO/IEC 42001 (documented information; control of changes)",
      "NIST AI RMF (Govern: policies, processes and accountability)",
    ],
  },
  224: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "AI mostly breaks assumptions inside existing policies. Look for the ones that assume a fixed purpose for data or a human author for output.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      C:
        "Procurement route changes do not disturb reimbursement rules.",
      D:
        "Physical security assumptions are unchanged by what the stored artefact is.",
      E:
        "Site visits are ordinary business travel.",
    },
    sources: [
      "ISO/IEC 42001 (Annex A: data for AI systems)",
      "NIST AI RMF (Govern: legal and policy alignment)",
    ],
  },
  225: {
    bokSubdomain: "I.C",
    difficulty: "advanced",
    keyTakeaway:
      "The contractual gap that bites is the silent model change. Notice plus a response window turns it into an event you can validate before it reaches your users.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "A credit pays after the harm and does not prevent it.",
      C:
        "A training-data warranty addresses provenance, not post-signature change.",
      D:
        "Termination is a last resort that leaves the current deployment unprotected.",
    },
    sources: [
      "ISO/IEC 42001 (Annex A: supplier relationships)",
      "NIST AI RMF (Govern: third-party agreements)",
    ],
  },
  226: {
    bokSubdomain: "I.C",
    difficulty: "applied",
    keyTakeaway:
      "An inventory answers only what its fields capture. Record purpose, affected population and impact, or it stays an asset list.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      B:
        "Who maintains the list does not determine what it records.",
      C:
        "Pilot status is another missing field, not the reason the question fails.",
      D:
        "Currency matters, but a current list of the wrong fields still cannot answer.",
    },
    sources: [
      "ISO/IEC 42001 (Annex A: AI system inventory and documentation)",
      "NIST AI RMF (Map: cataloguing systems and their contexts)",
    ],
  },
  227: {
    bokSubdomain: "II.A",
    difficulty: "applied",
    keyTakeaway:
      "Holding data lawfully is not the same as being allowed to train on it. Training is a distinct purpose that needs its own compatibility or basis analysis.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Proportionality is judged against a purpose, which is the step being skipped.",
      C:
        "Anonymisation is one way to resolve the issue, not a universal requirement.",
      D:
        "No general rule requires payment for commercial use of personal data.",
    },
    sources: [
      "GDPR Art. 5(1)(b) and Art. 6(4) (purpose limitation and compatibility)",
      "NIST AI RMF (Map: data provenance and permitted use)",
    ],
  },
  228: {
    bokSubdomain: "II.A",
    difficulty: "advanced",
    keyTakeaway:
      "Erasure reaches wherever the data went. Training splits that into the corpus and the model, and memorisation means the model is not automatically out of scope.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      C:
        "Accuracy cost is not a lawful ground for refusing a right.",
      D:
        "The original basis does not dispose of a later erasure request.",
      E:
        "Volume of similar requests does not change this individual's entitlement.",
    },
    sources: [
      "GDPR Art. 17 (right to erasure)",
      "NIST AI RMF (Map: data lifecycle and memorisation risk)",
    ],
  },
  229: {
    bokSubdomain: "II.A",
    difficulty: "applied",
    keyTakeaway:
      "Systematic profiling at scale triggers an impact assessment before processing starts — early enough that the findings can still change the design.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      B:
        "General registration was largely replaced by accountability obligations.",
      C:
        "Representative requirements follow establishment, not processing type.",
      D:
        "Certification is voluntary and does not substitute for an assessment.",
    },
    sources: [
      "GDPR Art. 35 (data protection impact assessment)",
      "NIST AI RMF (Map: impact assessment before deployment)",
    ],
  },
  230: {
    bokSubdomain: "II.A",
    difficulty: "applied",
    keyTakeaway:
      "Processing on instructions narrows what you decide, not what you owe. Security and sub-processor control are the processor's own duties.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Processors carry direct statutory duties regardless of who sets the purpose.",
      C:
        "Joint liability requires jointly determining purposes and means.",
      D:
        "Assessing the client's purpose is the controller's responsibility.",
    },
    sources: [
      "GDPR Art. 28 and Art. 32 (processor obligations; security)",
      "ISO/IEC 42001 (Annex A: suppliers)",
    ],
  },
  231: {
    bokSubdomain: "II.A",
    difficulty: "advanced",
    keyTakeaway:
      "Dropping identifiers is not anonymisation. The test is whether an individual can still be singled out from what remains, in the context the data sits in.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Genuinely anonymous data falls outside the regime.",
      C:
        "Data can be lawfully anonymised after having been personal.",
      D:
        "No approval regime governs anonymisation techniques.",
    },
    sources: [
      "GDPR Recital 26 (means reasonably likely to be used to identify)",
      "NIST AI RMF (Map: data characteristics and privacy risk)",
    ],
  },
  232: {
    bokSubdomain: "II.A",
    difficulty: "advanced",
    keyTakeaway:
      "Cross-border AI raises two distinct questions: which law reaches you, and what mechanism covers each data flow. Answering one does not answer the other.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      C:
        "The hosting provider is an architectural choice, not a determinant of applicable law.",
      D:
        "Implementation framework has no bearing on jurisdiction.",
      E:
        "Hardware choice is irrelevant to compliance scope.",
    },
    sources: [
      "GDPR Art. 3 and Chapter V (territorial scope; international transfers)",
      "OECD AI Principles (international co-operation)",
    ],
  },
  233: {
    bokSubdomain: "II.A",
    difficulty: "applied",
    keyTakeaway:
      "One user's input surfacing to another is an unauthorised disclosure. Retention design may contribute, but the obligation engaged is security of processing.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      A:
        "Staleness is a different defect from disclosure to the wrong person.",
      C:
        "Retention may contribute but is not the obligation breached.",
      D:
        "Portability concerns giving data to its subject, not leaking it to others.",
    },
    sources: [
      "GDPR Art. 5(1)(f) and Art. 32 (integrity, confidentiality and security)",
      "NIST AI RMF (Manage: incident response)",
    ],
  },
  234: {
    bokSubdomain: "II.A",
    difficulty: "advanced",
    keyTakeaway:
      "Inferred sensitive characteristics are sensitive data. Not collecting a health field does not put a health inference outside the heightened conditions.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Derivation does not place the resulting data outside the regime.",
      C:
        "Employment history is ordinarily relevant to hiring.",
      D:
        "Transparency is a real but secondary concern here.",
    },
    sources: [
      "GDPR Art. 9 (special categories of personal data)",
      "NIST AI RMF (Measure: proxy and inferred attributes)",
    ],
  },
  235: {
    bokSubdomain: "II.B",
    difficulty: "applied",
    keyTakeaway:
      "When safety telemetry starts informing performance decisions, employment and monitoring law attaches to the new purpose — the original safety justification does not carry over.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Product safety law governs the equipment, not how its data is used about people.",
      C:
        "Vendor market position is unrelated to the change of use.",
      D:
        "Export control is not engaged by internal reuse of data.",
    },
    sources: [
      "GDPR Art. 5(1)(b) and Art. 88 (purpose limitation; processing in employment)",
      "OECD AI Principles (human-centred values)",
    ],
  },
  236: {
    bokSubdomain: "II.B",
    difficulty: "advanced",
    keyTakeaway:
      "Disparate impact turns on the less discriminatory alternative, not on intent. With a model, alternatives are usually testable — which makes the second limb the hard one.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      C:
        "Impact liability does not require discriminatory intent.",
      D:
        "Developer credentials are not part of the legal test.",
      E:
        "Notice addresses transparency duties, not the discrimination analysis.",
    },
    sources: [
      "Title VII of the Civil Rights Act and the Fair Housing Act (disparate impact framework)",
      "NIST AI RMF (Measure: harmful bias evaluation)",
    ],
  },
  237: {
    bokSubdomain: "II.B",
    difficulty: "applied",
    keyTakeaway:
      "Unsubstantiated AI performance claims are ordinary deceptive-marketing exposure. Consumer protection law already reaches them and does not need an AI statute.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      B:
        "General licensing requirements for AI tools are not in force.",
      C:
        "Copyright exposure depends on training-data facts, not the claim.",
      D:
        "Registration duties attach to specific high-risk categories.",
    },
    sources: [
      "US Federal Trade Commission Act s.5 (unfair or deceptive practices)",
      "OECD AI Principles (transparency and accountability)",
    ],
  },
  238: {
    bokSubdomain: "II.B",
    difficulty: "applied",
    keyTakeaway:
      "Infringement follows use and distribution. Whoever publishes the output is exposed regardless of what generated it.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Provider exposure is a separate question and does not discharge the publisher's act.",
      C:
        "Machine generation does not immunise infringing output.",
      D:
        "Internal attribution does not move liability off the company.",
    },
    sources: [
      "Berne Convention (reproduction and distribution rights)",
      "ISO/IEC 42001 (Annex A: intellectual property considerations)",
    ],
  },
  239: {
    bokSubdomain: "II.B",
    difficulty: "applied",
    keyTakeaway:
      "AI embedded in a product that injures someone is a product liability question. Software integral to a marketed product is increasingly treated as part of the product.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      B:
        "Negligence claims target practitioners, not the manufacturer's product.",
      C:
        "Terms of sale do not exclude injury claims by third parties.",
      D:
        "Data protection addresses informational rather than physical harm.",
    },
    sources: [
      "EU Product Liability Directive as revised (software and AI components)",
      "NIST AI RMF (Map: safety-critical contexts)",
    ],
  },
  240: {
    bokSubdomain: "II.B",
    difficulty: "advanced",
    keyTakeaway:
      "Publicly accessible is not publicly licensed, and public personal data is still personal data. Both questions have to be answered before scraping becomes training.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      C:
        "Corpus size is a technical adequacy question, not a legal one.",
      D:
        "Unchallenged competitor practice is not a defence.",
      E:
        "Storage region affects transfers, not the right to use the material.",
    },
    sources: [
      "GDPR Art. 6 and Art. 14 (basis and notice for indirectly collected data)",
      "ISO/IEC 42001 (Annex A: data provenance and rights to use data)",
    ],
  },
  241: {
    bokSubdomain: "II.B",
    difficulty: "applied",
    keyTakeaway:
      "Existing sector rules apply to AI outputs unchanged. AI-specific law sits alongside them; it does not replace or relax them.",
    frameworkTags: ["AI Governance", "AI Risk Management"],
    distractorNotes: {
      B:
        "No general waiver exists for automated pricing.",
      C:
        "The burden of justification stays with the regulated firm.",
      D:
        "AI-specific rules are additional, not substitutional.",
    },
    sources: [
      "OECD AI Principles (accountability)",
      "NIST AI RMF (Govern: legal and regulatory alignment)",
    ],
  },
  242: {
    bokSubdomain: "II.B",
    difficulty: "advanced",
    keyTakeaway:
      "Broad permissions are read against the drafter and against what the customer would reasonably have expected. Service improvement does not stretch to training a general-purpose model.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Standard terms are not unenforceable merely for being standard.",
      C:
        "Contractual terms can form part of a lawful basis analysis.",
      D:
        "No general annual renewal requirement applies.",
    },
    sources: [
      "GDPR Art. 5(1)(a) and Art. 6(4) (fairness; compatibility of further processing)",
      "OECD AI Principles (transparency)",
    ],
  },
  243: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Synthetic content that could pass for real triggers a disclosure duty to the audience. That is a transparency obligation, not the high-risk regime.",
    frameworkTags: ["EU AI Act", "Responsible AI"],
    distractorNotes: {
      A:
        "Conformity assessment attaches to high-risk classification, not synthetic media.",
      C:
        "Registration follows high-risk classification, not generation of content.",
      D:
        "Synthetic presenters are not a prohibited practice.",
    },
    sources: [
      "EU AI Act (transparency obligations for synthetic and deepfake content)",
      "OECD AI Principles (transparency)",
    ],
  },
  244: {
    bokSubdomain: "II.C",
    difficulty: "foundational",
    keyTakeaway:
      "Prohibited means no compliance route exists. High-risk means permitted with obligations. Social scoring across unrelated contexts sits in the first category.",
    frameworkTags: ["EU AI Act", "AI Governance"],
    distractorNotes: {
      B:
        "Employment screening is high-risk and permitted with obligations.",
      C:
        "Emergency triage is high-risk, not prohibited.",
      D:
        "Creditworthiness assessment is a recognised high-risk use.",
    },
    sources: [
      "EU AI Act (prohibited practices; high-risk classification)",
      "NIST AI RMF (Map: intended purpose and context)",
    ],
  },
  245: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Deployer duties are operational: use as instructed and staff the oversight. Assessment, documentation and post-market monitoring stay with the provider.",
    frameworkTags: ["EU AI Act", "AI Governance"],
    distractorNotes: {
      C:
        "Conformity assessment precedes market placement and is the provider's.",
      D:
        "Technical documentation is drawn up by the provider.",
      E:
        "Post-market monitoring is established by the provider.",
    },
    sources: [
      "EU AI Act (obligations of providers and deployers of high-risk systems)",
      "ISO/IEC 42001 (Annex A: use of third-party AI systems)",
    ],
  },
  246: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "A general-purpose provider's duty is to inform, not to approve. Documentation is what lets downstream integrators meet obligations the provider cannot meet for them.",
    frameworkTags: ["EU AI Act", "AI Governance"],
    distractorNotes: {
      A:
        "Per-application approval is impractical and not required.",
      C:
        "Indemnities are commercial terms, not regulatory obligations.",
      D:
        "A closed use list is inconsistent with a general-purpose model.",
    },
    sources: [
      "EU AI Act (obligations for general-purpose AI model providers)",
      "NIST AI RMF (Govern: transparency across the value chain)",
    ],
  },
  247: {
    bokSubdomain: "II.C",
    difficulty: "applied",
    keyTakeaway:
      "Sequence by lead time, not by effective date. An obligation needing twelve months of work cannot be started on the day it applies.",
    frameworkTags: ["EU AI Act", "AI Governance"],
    distractorNotes: {
      A:
        "Waiting consumes exactly the runway the staging was designed to give.",
      C:
        "Treating everything as immediate wastes effort on unsettled requirements.",
      D:
        "Scoping to one system leaves the rest of the portfolio exposed.",
    },
    sources: [
      "EU AI Act (phased application of obligations)",
      "ISO/IEC 42001 (planning; management of change)",
    ],
  },
  248: {
    bokSubdomain: "II.C",
    difficulty: "foundational",
    keyTakeaway:
      "Risk tier follows use and consequence: a listed consequential domain, or a safety component of a regulated product. Model size and procurement route are irrelevant to it.",
    frameworkTags: ["EU AI Act", "AI Risk Management"],
    distractorNotes: {
      C:
        "Parameter count describes capability, not regulatory classification.",
      D:
        "Build or buy changes which obligations you hold, not the tier.",
      E:
        "Organisation size does not determine the risk tier.",
    },
    sources: [
      "EU AI Act (classification rules for high-risk AI systems)",
      "NIST AI RMF (Map: context, purpose and impact)",
    ],
  },
  249: {
    bokSubdomain: "II.C",
    difficulty: "advanced",
    keyTakeaway:
      "AI regimes converge on substance and diverge on detail. Build once to the common core, then layer the jurisdiction-specific differences.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      A:
        "Building to the floor guarantees rework in the stricter jurisdiction.",
      C:
        "Separate models multiply the systems that must each be governed.",
      D:
        "Applying the strictest regime everywhere spends effort where nothing requires it.",
    },
    sources: [
      "ISO/IEC 42001 (management system covering multiple obligations)",
      "OECD AI Principles (international interoperability)",
    ],
  },
  250: {
    bokSubdomain: "II.D",
    difficulty: "foundational",
    keyTakeaway:
      "Both are voluntary. The framework organises the work; the management system standard is the one you can be certified against and show to a third party.",
    frameworkTags: ["NIST AI RMF", "ISO 42001"],
    distractorNotes: {
      A:
        "Neither instrument is legally binding of itself.",
      C:
        "Both are technology-neutral and cover generative systems.",
      D:
        "Neither is limited to a single value-chain role.",
    },
    sources: [
      "NIST AI RMF 1.0 (purpose and voluntary status)",
      "ISO/IEC 42001 (certifiable management system requirements)",
    ],
  },
  251: {
    bokSubdomain: "II.D",
    difficulty: "applied",
    keyTakeaway:
      "Manage is where measured risk becomes action. A register that never moves means the work stopped after Measure.",
    frameworkTags: ["NIST AI RMF", "AI Risk Management"],
    distractorNotes: {
      A:
        "Govern sets the conditions for all four functions but is not where treatment happens.",
      C:
        "A static register does not indicate identification failed.",
      D:
        "Measurement sensitivity is a different problem from inaction.",
    },
    sources: [
      "NIST AI RMF 1.0 (Manage function)",
      "ISO/IEC 42001 (risk treatment and monitoring)",
    ],
  },
  252: {
    bokSubdomain: "II.D",
    difficulty: "applied",
    keyTakeaway:
      "Ask for evidence that is either independently verified or specific to the system you are buying. Read the certificate's scope — a narrow one can exclude the product.",
    frameworkTags: ["ISO 42001", "AI Governance"],
    distractorNotes: {
      C:
        "A public commitment is unverified and generic.",
      D:
        "Headcount says nothing about whether the process was applied.",
      E:
        "Association membership is not an assurance mechanism.",
    },
    sources: [
      "ISO/IEC 42001 (certification and scope statements)",
      "NIST AI RMF (Govern: third-party assurance)",
    ],
  },
  253: {
    bokSubdomain: "II.D",
    difficulty: "foundational",
    keyTakeaway:
      "A certificate says you run a managed process within a stated scope. It is not a safety test, an accuracy guarantee, or a statement of legal compliance.",
    frameworkTags: ["ISO 42001", "AI Governance"],
    distractorNotes: {
      A:
        "Certification audits the system of management, not each AI system's safety.",
      C:
        "Legal compliance is assessed by regulators, not by certification bodies.",
      D:
        "No accuracy threshold is defined or attested by the standard.",
    },
    sources: [
      "ISO/IEC 42001 (scope of certification)",
      "NIST AI RMF (Govern: assurance and its limits)",
    ],
  },
  254: {
    bokSubdomain: "II.D",
    difficulty: "applied",
    keyTakeaway:
      "Management system standards share a common clause structure. Extend the system you have rather than standing up a parallel one.",
    frameworkTags: ["ISO 42001", "AI Governance"],
    distractorNotes: {
      A:
        "Parallel systems duplicate the same governance machinery twice.",
      C:
        "Information security obligations do not disappear when AI ones arrive.",
      D:
        "The harmonised structure already exists; there is nothing to wait for.",
    },
    sources: [
      "ISO/IEC 42001 (harmonised structure with other management system standards)",
      "NIST AI RMF (Govern: integrating with existing processes)",
    ],
  },
  255: {
    bokSubdomain: "II.D",
    difficulty: "foundational",
    keyTakeaway:
      "The OECD principles matter as shared vocabulary. Many national frameworks and laws inherited their definitions and principle set.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "They are not directly enforced by regulators.",
      C:
        "They are principles, not technical control sets.",
      D:
        "They establish no certification regime.",
    },
    sources: [
      "OECD AI Principles (definition of an AI system; values-based principles)",
      "NIST AI RMF (alignment with international principles)",
    ],
  },
  256: {
    bokSubdomain: "II.D",
    difficulty: "applied",
    keyTakeaway:
      "Standards buy demonstrability at the cost of prescription; frameworks buy flexibility at the cost of external evidence. Choose on which you actually need.",
    frameworkTags: ["ISO 42001", "NIST AI RMF"],
    distractorNotes: {
      C:
        "Press coverage is not evidence of fit.",
      D:
        "Recency does not indicate suitability.",
      E:
        "Document length is not a selection criterion.",
    },
    sources: [
      "ISO/IEC 42001 (conformity and certification)",
      "NIST AI RMF 1.0 (flexible, outcome-based application)",
    ],
  },
  257: {
    bokSubdomain: "II.D",
    difficulty: "advanced",
    keyTakeaway:
      "Framework self-assessments fail by counting documents as controls. Check that each claim resolves to evidence of the control operating.",
    frameworkTags: ["NIST AI RMF", "ISO 42001"],
    distractorNotes: {
      A:
        "External review is valuable but comes after knowing what the claims mean.",
      C:
        "Version currency does not make an unevidenced claim true.",
      D:
        "Instrument choice is a separate question from whether the mapping is honest.",
    },
    sources: [
      "ISO/IEC 42001 (documented information as evidence; internal audit)",
      "NIST AI RMF (Govern: measurement and accountability)",
    ],
  },
  258: {
    bokSubdomain: "II.D",
    difficulty: "applied",
    keyTakeaway:
      "A model card describes the model; a system card describes what was built around it. A sound model inside an unsafe system is a real outcome, so both are needed.",
    frameworkTags: ["Responsible AI", "AI Governance"],
    distractorNotes: {
      A:
        "They document different scopes and are not interchangeable.",
      C:
        "Taking whichever is offered leaves one set of questions unanswered.",
      D:
        "Both exist to inform whoever relies on the system.",
    },
    sources: [
      "NIST AI RMF (Map: documentation of system and context)",
      "ISO/IEC 42001 (Annex A: AI system documentation)",
    ],
  },
  259: {
    bokSubdomain: "III.A",
    difficulty: "advanced",
    keyTakeaway:
      "Name the outcome before the proxy, and pair every primary metric with a guardrail that would degrade if the primary were being gamed.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
    distractorNotes: {
      C:
        "Selecting the metric the model wins on chooses the measurement to suit the result.",
      D:
        "Deferring until after results lets the outcome pick the metric.",
      E:
        "Inheriting a vendor metric inherits its blind spots too.",
    },
    sources: [
      "NIST AI RMF (Map: defining benefits and metrics; Measure: metric selection)",
      "ISO/IEC 42001 (objectives and planning to achieve them)",
    ],
  },
  260: {
    bokSubdomain: "III.A",
    difficulty: "applied",
    keyTakeaway:
      "Operators and affected people see different risks. Consulting the people who run the system is not consulting the people it decides about.",
    frameworkTags: ["Responsible AI", "AI Governance"],
    distractorNotes: {
      A:
        "Feasibility is an engineering question the interviews were not for.",
      C:
        "Method is secondary to who was consulted.",
      D:
        "Documentation form does not address the missing perspective.",
    },
    sources: [
      "NIST AI RMF (Map: engagement with affected communities)",
      "ISO/IEC 42001 (Annex A: interested parties)",
    ],
  },
  261: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "Lineage is cheap to capture at assembly and unrecoverable later. Without it, rights, deletion and behaviour questions all become unanswerable at once.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      B:
        "Size affects cost and compute, not answerability.",
      C:
        "Feature count affects interpretability, not provenance.",
      D:
        "Storage format is a technical detail that can be converted.",
    },
    sources: [
      "ISO/IEC 42001 (Annex A: data provenance and lineage)",
      "NIST AI RMF (Map: data documentation)",
    ],
  },
  262: {
    bokSubdomain: "III.B",
    difficulty: "advanced",
    keyTakeaway:
      "Random splits assume independent rows. When an entity recurs, split by entity — otherwise the score measures recall and reports it as generalisation.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      C:
        "Set size is a separate design choice unaffected by the leakage.",
      D:
        "Feature dominance is not caused by how the split was made.",
      E:
        "Minimisation concerns what data is held, not how it is partitioned.",
    },
    sources: [
      "NIST AI RMF (Measure: validity and reliability of evaluation)",
      "ISO/IEC 42001 (Annex A: verification and validation of AI systems)",
    ],
  },
  263: {
    bokSubdomain: "III.B",
    difficulty: "advanced",
    keyTakeaway:
      "More data only fixes a sampling problem. If the labels carry the bias, additional examples teach the same error more confidently.",
    frameworkTags: ["Responsible AI", "AI Risk Management"],
    distractorNotes: {
      B:
        "Storage location is a pipeline concern, not a cause of the gap.",
      C:
        "Architecture does not determine whether more data helps.",
      D:
        "Training time is a cost, not a reason the approach fails.",
    },
    sources: [
      "NIST AI RMF (Measure: bias sources across the lifecycle)",
      "ISO/IEC 42001 (Annex A: data quality for AI systems)",
    ],
  },
  264: {
    bokSubdomain: "III.B",
    difficulty: "applied",
    keyTakeaway:
      "Synthetic data inherits its generator's assumptions and is weakest in the tails — which is usually where the consequential cases are.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      A:
        "Infrastructure approval is an operational control, not a fidelity question.",
      C:
        "Volume without fidelity produces confident nonsense.",
      D:
        "Distinguishability matters for disclosure, not for whether the model learns.",
    },
    sources: [
      "NIST AI RMF (Map: data representativeness)",
      "ISO/IEC 42001 (Annex A: data for AI systems)",
    ],
  },
  265: {
    bokSubdomain: "III.C",
    difficulty: "applied",
    keyTakeaway:
      "Retirement runs both ways: keep what is needed to explain past decisions, and confirm nothing downstream still depends on the model before switching it off.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      C:
        "Publication is a separate decision unrelated to retirement duties.",
      D:
        "Deleting everything destroys the record needed to answer challenges.",
      E:
        "Vendor notice is a contractual formality, not a governance priority.",
    },
    sources: [
      "ISO/IEC 42001 (Annex A: AI system lifecycle including retirement)",
      "NIST AI RMF (Manage: decommissioning)",
    ],
  },
  266: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Performance is a property of a model in a context, not of a model. Re-establish it wherever the deployment conditions differ from where it was validated.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      B:
        "Bandwidth is a feasibility constraint, not evidence the system works there.",
      C:
        "Licence pricing is a commercial term unrelated to safety performance.",
      D:
        "Consultation is required but does not establish whether detection holds up.",
    },
    sources: [
      "NIST AI RMF (Map: context of use; Measure: validity in deployment conditions)",
      "ISO/IEC 42001 (Annex A: AI system impact assessment)",
    ],
  },
  267: {
    bokSubdomain: "IV.A",
    difficulty: "applied",
    keyTakeaway:
      "Retrieval buys currency and citation; fine-tuning buys behaviour and style. Choose on whether the knowledge moves and whether answers must be traceable.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      C:
        "A retrieval step adds latency rather than removing it.",
      D:
        "Retrieval reads the document estate; it does not shrink it.",
      E:
        "Adopting a house style is what fine-tuning does well.",
    },
    sources: [
      "NIST AI RMF (Map: system design choices and their risk profile)",
      "ISO/IEC 42001 (Annex A: AI system design and development)",
    ],
  },
  268: {
    bokSubdomain: "IV.A",
    difficulty: "advanced",
    keyTakeaway:
      "Text can be discarded; an action cannot. Agentic systems need authorisation limits, action logs and a route back before they are switched on, not after.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
    distractorNotes: {
      A:
        "Resource cost does not change what the system can do unsupervised.",
      C:
        "Comprehensibility is a usability concern, not the structural change.",
      D:
        "Prompt sophistication is an engineering difficulty, not a risk driver.",
    },
    sources: [
      "NIST AI RMF (Manage: human-AI configuration and autonomy)",
      "ISO/IEC 42001 (Annex A: control of AI system operation)",
    ],
  },
  269: {
    bokSubdomain: "IV.B",
    difficulty: "advanced",
    keyTakeaway:
      "One accuracy figure hides the distribution it was measured on and the split between error types. Ask about both before treating it as a property of your deployment.",
    frameworkTags: ["AI Risk Management", "AI Governance"],
    distractorNotes: {
      B:
        "A comparison between two unrepresentative numbers is still unrepresentative.",
      C:
        "A warranty allocates cost after the fact and does not make the figure apply.",
      D:
        "An audit verifies the measurement, not that it describes Meridian's content.",
    },
    sources: [
      "NIST AI RMF (Measure: evaluation validity and error analysis)",
      "ISO/IEC 42001 (Annex A: third-party AI system assessment)",
    ],
  },
  270: {
    bokSubdomain: "IV.B",
    difficulty: "applied",
    keyTakeaway:
      "You need the properties, not the source list: rights to use the data, evaluation results, known limitations. All three can be warranted without disclosing a corpus.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      A:
        "Walking away discards options that could still be assessed.",
      C:
        "Accepting silence leaves the buyer's actual questions unanswered.",
      D:
        "Third-party disclosure is disproportionate when warranties would do.",
    },
    sources: [
      "ISO/IEC 42001 (Annex A: supplier assessment and agreements)",
      "NIST AI RMF (Govern: third-party transparency)",
    ],
  },
  271: {
    bokSubdomain: "IV.B",
    difficulty: "applied",
    keyTakeaway:
      "An impact assessment is about the person on the receiving end: what a wrong answer costs them, whether they could find out, and whether groups are treated differently for a reason.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
    distractorNotes: {
      C:
        "Team size is a delivery fact, not an impact.",
      D:
        "Hosting region bears on transfers, not on impact to individuals.",
      E:
        "Licensing cost belongs to the business case.",
    },
    sources: [
      "ISO/IEC 42001 (Annex A: AI system impact assessment)",
      "NIST AI RMF (Map: impacts on individuals and groups)",
    ],
  },
  272: {
    bokSubdomain: "IV.B",
    difficulty: "applied",
    keyTakeaway:
      "Building adds provider obligations on top of deployer ones. Buying moves the development account to the vendor and leaves every use-side duty where it was.",
    frameworkTags: ["EU AI Act", "AI Governance"],
    distractorNotes: {
      A:
        "Training obligations attach to deployment either way.",
      C:
        "Production monitoring is owed by the deployer regardless of origin.",
      D:
        "Disclosure duties follow the use, not the build.",
    },
    sources: [
      "EU AI Act (provider obligations; technical documentation)",
      "ISO/IEC 42001 (Annex A: AI system development)",
    ],
  },
  273: {
    bokSubdomain: "IV.B",
    difficulty: "advanced",
    keyTakeaway:
      "Model licences constrain two things: what use is permitted, and what may be done with the output. Internal and customer-facing use are routinely priced and licensed apart.",
    frameworkTags: ["AI Governance", "ISO 42001"],
    distractorNotes: {
      C:
        "Capacity planning is an engineering concern, not a licence question.",
      D:
        "No general duty requires publishing licence terms.",
      E:
        "Registration with competitors is not a thing any licence requires.",
    },
    sources: [
      "ISO/IEC 42001 (Annex A: supplier agreements and acceptable use)",
      "NIST AI RMF (Govern: contractual controls in the value chain)",
    ],
  },
  274: {
    bokSubdomain: "IV.C",
    difficulty: "applied",
    keyTakeaway:
      "Purpose drift is fixed by a boundary you can enforce. State the permitted uses, then make access and retention carry the rule.",
    frameworkTags: ["AI Governance", "Responsible AI"],
    distractorNotes: {
      A:
        "Fewer alerts does not stop the ones generated being reused.",
      C:
        "A different vendor inherits the same unmanaged secondary use.",
      D:
        "Wider coverage produces more data for the same drift.",
    },
    sources: [
      "GDPR Art. 5(1)(b) (purpose limitation)",
      "ISO/IEC 42001 (Annex A: use of AI system outputs)",
    ],
  },
  275: {
    bokSubdomain: "IV.C",
    difficulty: "advanced",
    keyTakeaway:
      "When complaints and metrics disagree, believe both and disaggregate. Complaints are monitoring signal about exactly what your metrics failed to anticipate.",
    frameworkTags: ["AI Risk Management", "Responsible AI"],
    distractorNotes: {
      C:
        "Reassurance asserts the conclusion the disagreement puts in doubt.",
      D:
        "Retraining before the cause is known is a guess with a cost.",
      E:
        "Changing the deferral threshold acts on an undiagnosed problem.",
    },
    sources: [
      "NIST AI RMF (Measure: disaggregated monitoring; Manage: feedback channels)",
      "ISO/IEC 42001 (monitoring, measurement and improvement)",
    ],
  },
};
