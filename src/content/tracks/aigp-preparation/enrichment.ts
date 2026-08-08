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
};
