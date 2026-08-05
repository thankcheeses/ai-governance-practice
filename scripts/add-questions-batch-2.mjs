/**
 * Appends the 32-question AIGP practice set (ids 51–82) to the question bank.
 *
 * The supplied source carried the same two answer leaks the original 50 did,
 * milder but present: 62% of its answers were "B" and "D" was never correct
 * once. Both are corrected here before the questions enter the bank —
 * option lengths sit in a tight band and correct answers are distributed
 * across all four letters, so `npm run check:questions` passes on the
 * combined 82.
 *
 * Rationales are rewritten to explain the correct answer without naming option
 * letters. The source rationales referenced letters ("A misapplies…"), which
 * would have been wrong the moment options were reordered, and the existing 50
 * already follow the letter-free convention.
 *
 * Domain counts follow the source's blueprint weighting: 6 / 8 / 9 / 9.
 *
 * Run once: node scripts/add-questions-batch-2.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = "src/content/tracks/aigp-preparation/questions.json";
const LETTERS = ["A", "B", "C", "D"];

const FOUNDATIONS = "Foundations of AI Governance";
const LAWS = "Laws, Standards, and Frameworks";
const DEVELOPMENT = "Governing AI Development";
const DEPLOYMENT = "Governing AI Deployment and Use";

/** options are letter-free; `correct` is the index of the right one. */
const NEW_QUESTIONS = [
  {
    id: 51,
    domain: FOUNDATIONS,
    question:
      "A manufacturer wants to replace a rules-based automation tool with a machine learning system that adjusts equipment settings from live sensor data. Which factor most justifies governing the new system differently from the one it replaces?",
    options: [
      "It consumes substantially more compute, so infrastructure cost and capacity planning change.",
      "It comes from a different vendor, so the existing supplier assurances no longer transfer.",
      "It will be operated by more staff, so the training and access footprint grows considerably.",
      "Its outputs are probabilistic and cannot be fully predicted from the underlying logic.",
    ],
    correct: 3,
    rationale:
      "The probabilistic, non-deterministic nature of machine learning is the substantive reason it needs governance beyond traditional software. The same input may not yield the same output, and behaviour cannot be established by reading the logic, so monitoring and evaluation controls become necessary. Compute, vendor, and headcount are operational details that do not change the governance rationale.",
    tags: ["foundations", "non-determinism", "AI vs software", "oversight"],
  },
  {
    id: 52,
    domain: FOUNDATIONS,
    question:
      "During design review of a resume-screening tool, a reviewer insists hiring managers must be able to understand in plain terms why one candidate ranked above another. Which responsible AI principle does this most directly reflect?",
    options: [
      "Data minimisation, limiting the personal data collected to what the ranking actually requires.",
      "Transparency and explainability, so the basis for an output is intelligible to those relying on it.",
      "Accountability, assigning a named owner responsible for the ranking decisions the tool produces.",
      "Human oversight, ensuring a recruiter formally approves the ranking before interviews are offered.",
    ],
    correct: 1,
    rationale:
      "Making a system's reasoning understandable to the people relying on it is a direct expression of transparency and explainability. The other principles named are real and adjacent — minimisation governs what data is used, accountability governs who answers for the outcome, oversight governs who can intervene — but none of them is the requirement that a decision be comprehensible.",
    tags: ["foundations", "transparency", "explainability", "hiring"],
  },
  {
    id: 53,
    domain: FOUNDATIONS,
    question:
      "A retailer's newly formed AI governance committee is staffed entirely by data scientists. Leadership questions the structure before it approves its first high-risk use case. What gap does this staffing most likely create?",
    options: [
      "Risks outside technical performance, such as legal and ethical exposure, go unrecognised.",
      "Decisions slow down because the members are unfamiliar with agile delivery practices.",
      "Access to the underlying model source code becomes harder to obtain for review purposes.",
      "Consensus becomes difficult to reach because the committee has grown too large to steer.",
    ],
    correct: 0,
    rationale:
      "Governance depends on cross-functional composition precisely so legal, ethical, and business considerations sit alongside technical ones. A body drawn from a single function, however skilled, sees only the risks that function is trained to see. The scenario also describes a narrow committee rather than an oversized one, and a data-science group would have more access to code, not less.",
    tags: ["foundations", "governance structure", "cross-functional", "blind spots"],
  },
  {
    id: 54,
    domain: FOUNDATIONS,
    question:
      "A nonprofit licenses a general-purpose chatbot and configures it to answer donor questions on its website, without building or training any part of the underlying model. What best describes its governance role?",
    options: [
      "An end user with no organisation-level obligations, since staff simply operate a licensed tool.",
      "A developer obliged to repeat the vendor's pre-training data governance for the model it uses.",
      "A deployer responsible for governing how it configures, monitors, and uses the system.",
      "A deployer with no obligations of its own, since the vendor built and trained the model.",
    ],
    correct: 2,
    rationale:
      "Governance frameworks separate developer duties, which attach to building or training a model, from deployer duties, which attach to putting a system into operational use in a particular context. An organisation can hold deployer obligations without training anything. Configuring and operating the chatbot creates real responsibility for its configuration, monitoring, and use.",
    tags: ["foundations", "deployer", "developer", "roles"],
  },
  {
    id: 55,
    domain: FOUNDATIONS,
    question:
      "A logistics company has privacy and security policies that predate its use of AI, and is now piloting an AI route optimisation tool. What is the most appropriate governance step regarding those policies?",
    options: [
      "Leave them as they are, since any policy covering data already covers AI systems by extension.",
      "Review and update them to address AI-specific considerations the originals never anticipated.",
      "Replace them with a separate AI policy set written specifically for machine learning systems.",
      "Defer policy work until the pilot concludes and the tool's actual behaviour is better understood.",
    ],
    correct: 1,
    rationale:
      "Extending existing privacy, security, data governance, and IP policies to cover AI-specific concerns preserves the institutional maturity already built into them while closing gaps such as training data provenance and model drift. Discarding them wastes relevant work, assuming they already suffice is a common and risky shortcut, and deferring leaves the pilot running without coverage.",
    tags: ["foundations", "policy", "AI-specific", "pilot"],
  },
  {
    id: 56,
    domain: FOUNDATIONS,
    question:
      "A hospital network's standard vendor questionnaire does not ask about training data sources or algorithmic risk, but procurement wants to proceed with an AI scheduling tool. What should governance require first?",
    options: [
      "Nothing further, because the existing questionnaire already captures the material vendor risks.",
      "A commitment from the vendor to publish its model source code before the contract is signed.",
      "A decision to build an equivalent tool in-house rather than accept unassessed vendor risk.",
      "Updated procurement processes and contract terms covering training data, bias, and accountability.",
    ],
    correct: 3,
    rationale:
      "Managing third-party AI risk means updating assessments, procurement processes, and contracts to capture issues pre-AI questionnaires were never written to surface: where training data came from, how bias is tested, and who is accountable for performance. Building in-house is disproportionate, and adequate assessment never requires a vendor to publish source code.",
    tags: ["foundations", "procurement", "third-party risk", "contracts"],
  },
  {
    id: 57,
    domain: LAWS,
    question:
      "A streaming service begins using an AI model to personalise recommendations from viewing history, but users were never told at signup that this processing would occur. Which privacy concept is most directly implicated?",
    options: [
      "Purpose limitation, since the data is being used beyond the purpose disclosed at collection.",
      "Data portability, since subscribers have no straightforward way to export their viewing history.",
      "Right to erasure, since the retained viewing history now feeds a purpose users never accepted.",
      "Cross-border transfer, since the service processes subscriber data across several jurisdictions.",
    ],
    correct: 0,
    rationale:
      "Purpose limitation requires that personal data be used only for the purposes disclosed at collection or a compatible one. Repurposing viewing history to drive a new recommendation feature without notice is the textbook case. The other concepts are real, but nothing in the facts involves an export request, a deletion request, or a transfer across borders.",
    tags: ["laws", "purpose limitation", "GDPR", "personalisation"],
  },
  {
    id: 58,
    domain: LAWS,
    question:
      "A lender's AI model approves or denies loan applications with no human review before applicants are notified. What obligation does this most likely trigger for the lender as a data controller?",
    options: [
      "A duty to retain every application record indefinitely so decisions remain auditable later.",
      "A duty to publish the scoring model's source code so applicants can inspect how it works.",
      "A duty tied to automated decision-making, such as providing a route to human review.",
      "A duty to obtain a separate licence authorising the use of AI in consumer lending decisions.",
    ],
    correct: 2,
    rationale:
      "Privacy laws commonly impose specific obligations where a decision is fully automated and has a significant effect on a person, and a loan denial is the standard example. Those obligations typically include a path to human intervention and a way to contest the outcome. The other options describe generic compliance activity that is not tied to automated decision-making.",
    tags: ["laws", "automated decision-making", "human review", "lending"],
  },
  {
    id: 59,
    domain: LAWS,
    question:
      "A media company trains a generative model on copyrighted news articles scraped from publisher websites without permission. Which area of existing law is most directly at issue?",
    options: [
      "Consumer protection law, treating the affected publishers as consumers of the model's output.",
      "Intellectual property law, because copyrighted material was used for training without permission.",
      "Product liability law, because the model shipped without disclosing a defect in its training data.",
      "Nondiscrimination law, because some publishers were scraped more heavily than others were.",
    ],
    correct: 1,
    rationale:
      "Using copyrighted material to train a model raises intellectual property questions, since the law in this area may restrict such use absent permission or a valid exception. Product liability concerns defective products rather than data sourcing, publishers are not consumers of the model, and nondiscrimination law protects classes of people rather than content owners.",
    tags: ["laws", "intellectual property", "training data", "copyright"],
  },
  {
    id: 60,
    domain: LAWS,
    question:
      "An insurer's underwriting model never takes race as an input, yet systematically charges higher premiums in zip codes that correlate strongly with race. Why might this still raise nondiscrimination concerns?",
    options: [
      "Because nondiscrimination law is triggered only where a protected trait is used as a direct input.",
      "Because insurance pricing sits outside the scope of nondiscrimination law in most jurisdictions.",
      "Because the model's overall predictive accuracy has fallen below the accepted industry benchmark.",
      "Because a facially neutral factor can still produce a discriminatory effect without being an input.",
    ],
    correct: 3,
    rationale:
      "Nondiscrimination law in lending, insurance, employment, and housing can be violated through disparate impact: a neutral-looking factor that correlates with a protected characteristic and produces a discriminatory outcome, even when the protected trait is never used. Insurance is a commonly cited context for this, and model accuracy is a separate question entirely.",
    tags: ["laws", "disparate impact", "proxy variables", "insurance"],
  },
  {
    id: 61,
    domain: LAWS,
    question:
      "A company is classifying an AI tool that screens resumes and selects candidates for interview under a risk-tiered AI regulatory framework. How would this use case most likely be classified?",
    options: [
      "High risk, given its effect on individuals' access to employment opportunities.",
      "Limited risk, because the tool only ranks candidates and a recruiter makes the final call.",
      "Minimal risk, because resume screening is a routine and long-established business function.",
      "Prohibited, because using AI to filter candidates for employment is banned outright.",
    ],
    correct: 0,
    rationale:
      "Risk-tiered frameworks commonly place employment uses, including recruitment and resume screening, in the high-risk tier because of their effect on access to economic opportunity, which brings obligations around risk management, documentation, and human oversight. Classification follows the impact of the use case, not whether a human is nominally in the loop.",
    tags: ["laws", "EU AI Act", "risk classification", "employment"],
  },
  {
    id: 62,
    domain: LAWS,
    question:
      "A company builds a general-purpose foundation model that other organisations license for varied downstream uses. How do its obligations typically compare with those of a company building a narrow, purpose-built tool?",
    options: [
      "It is generally exempt, because it does not control or foresee how licensees will use the model.",
      "It carries distinct obligations of its own, alongside the obligations attaching to downstream use.",
      "It is regulated only once one of its licensees puts the model into a high-risk deployment.",
      "It faces the identical use-case-specific requirements that a narrow-purpose tool builder faces.",
    ],
    correct: 1,
    rationale:
      "AI-specific law increasingly places obligations on general-purpose model providers — technical documentation, transparency about training — in addition to, not instead of, the obligations that attach to particular downstream deployments. The distinction between model-level and use-case-level duties is drawn deliberately, so neither exemption nor equivalence is right.",
    tags: ["laws", "general-purpose AI", "foundation models", "EU AI Act"],
  },
  {
    id: 63,
    domain: LAWS,
    question:
      "A governance team organises its risk activities around functions commonly described as govern, map, measure, and manage. Which framework does this describe?",
    options: [
      "ISO/IEC 42001, whose structure follows the certification audit cycle for management systems.",
      "The OECD AI Principles, whose structure follows agreement among participating member countries.",
      "The NIST AI Risk Management Framework, a voluntary framework built around core functions.",
      "The EU AI Act, whose structure follows the risk tiers and the penalties attaching to each.",
    ],
    correct: 2,
    rationale:
      "The NIST AI Risk Management Framework is organised around core functions — govern, map, measure, and manage — each with categories and subcategories beneath it, and it is voluntary rather than binding. ISO/IEC 42001 is a certifiable management system standard, and the EU AI Act is binding law structured around risk tiers.",
    tags: ["laws", "NIST AI RMF", "frameworks", "voluntary"],
  },
  {
    id: 64,
    domain: LAWS,
    question:
      "A company wants to certify formally that it operates a functioning AI management system, much as it once certified its information security management system. Which standard fits this goal?",
    options: [
      "ISO/IEC 22989, which establishes shared terminology and concepts for artificial intelligence.",
      "ISO/IEC 42001, which specifies certifiable requirements for an AI management system.",
      "ISO/IEC 42005, which addresses how to conduct impact assessments for AI systems.",
      "The NIST AI RMF, which offers a voluntary structure for identifying and treating AI risk.",
    ],
    correct: 1,
    rationale:
      "ISO/IEC 42001 specifies requirements for an AI management system that an organisation can be certified against, in the same way ISO/IEC 27001 works for information security. The other documents are real and relevant but serve different purposes: terminology, impact assessment methodology, and a voluntary risk framework that is not designed for certification.",
    tags: ["laws", "ISO 42001", "certification", "management system"],
  },
  {
    id: 65,
    domain: DEVELOPMENT,
    question:
      "A product team begins building an AI tool from a vague request to improve customer service, without documenting the problem it solves or how success will be judged. What is the most significant governance risk?",
    options: [
      "The team may settle on a data science framework nobody else in the organisation knows well.",
      "The team may be unable to recruit enough engineers to hit the delivery date it has committed to.",
      "Marketing may be left out of the launch, weakening the reception the finished tool receives.",
      "Undefined scope makes it hard to assess risk, guide design, and evaluate success afterwards.",
    ],
    correct: 3,
    rationale:
      "Defining the business context and use case is the foundational step in governing AI design: it anchors every later decision about architecture, risk assessment, metrics, and oversight. Skipping it makes each downstream governance activity harder to perform meaningfully. The alternatives are ordinary project concerns unrelated to undefined scope.",
    tags: ["development", "use case definition", "scope", "design phase"],
  },
  {
    id: 66,
    domain: DEVELOPMENT,
    question:
      "An analyst flags that an AI call-centre triage tool could occasionally misroute urgent complaints. The team debates whether to eliminate, reduce, or accept the risk. What should guide the decision?",
    options: [
      "A risk mitigation hierarchy that directs the most severe risks toward elimination or reduction.",
      "A practice of documenting every identified risk equally, without ranking severity or likelihood.",
      "A practice of escalating every identified risk to executives so no prioritisation call is needed.",
      "A decision deferred until six months of production data shows how often misrouting truly occurs.",
    ],
    correct: 0,
    rationale:
      "A risk mitigation hierarchy — typically elimination, then reduction, then control, then acceptance with monitoring — directs effort toward the risks that matter most, judged on severity and probability. Treating all risks alike defeats prioritisation, blanket escalation avoids the judgement rather than making it, and waiting for production data leaves people exposed in the interim.",
    tags: ["development", "risk mitigation", "prioritisation", "severity"],
  },
  {
    id: 67,
    domain: DEVELOPMENT,
    question:
      "A team completes the design phase of a fraud-detection model but never records why it selected certain input features over others. Why is this a governance concern?",
    options: [
      "Because design documentation exists mainly to give marketing accurate material to work from.",
      "Because undocumented rationale weakens the ability to demonstrate compliance and manage risk later.",
      "Because undocumented choices only become a problem if the model underperforms during testing.",
      "Because well-commented source code cannot substitute for a formal architectural specification.",
    ],
    correct: 1,
    rationale:
      "Documenting design decisions exists to establish compliance and manage risk: it lets an organisation explain and defend its choices to regulators, auditors, or affected individuals later, and it supports troubleshooting. The value is proactive rather than conditional on something going wrong, and code comments are a technical artefact, not a record of governance reasoning.",
    tags: ["development", "documentation", "design rationale", "auditability"],
  },
  {
    id: 68,
    domain: DEVELOPMENT,
    question:
      "A reviewer asks a data science team to trace where a model's training data originated and how it was transformed, and the team cannot fully reconstruct that history. Which concept does this gap relate to?",
    options: [
      "Data minimisation, since more data appears to have been collected than the model actually needs.",
      "Data retention, since the training data has evidently been kept longer than its purpose justifies.",
      "Data lineage and provenance, since the origin and transformations of the data cannot be traced.",
      "Data portability, since the training data cannot readily be exported into another environment.",
    ],
    correct: 2,
    rationale:
      "Data lineage and provenance is precisely the ability to trace where data came from and how it changed over time, which is the gap described. The other terms name real data governance concerns — excessive collection, over-retention, and inability to export — but none of those problems appears in the facts.",
    tags: ["development", "data lineage", "provenance", "traceability"],
  },
  {
    id: 69,
    domain: DEVELOPMENT,
    question:
      "Before releasing a resume-screening tool, a testing team wants to confirm the model does not systematically disadvantage any demographic group, in addition to being accurate overall. Which testing type addresses that second goal?",
    options: [
      "Unit testing, which verifies that individual components of the codebase behave as specified.",
      "Bias testing, which evaluates whether outputs disproportionately disadvantage particular groups.",
      "Integration testing, which verifies that separately built components work correctly together.",
      "Performance testing, which measures response time and resource consumption under realistic load.",
    ],
    correct: 1,
    rationale:
      "Bias testing is aimed squarely at identifying disparate outcomes across groups, which is the stated second goal. Unit and integration testing establish technical correctness, and performance testing measures speed and resource use. All are legitimate and necessary, but only bias testing answers the fairness question being asked.",
    tags: ["development", "bias testing", "fairness", "pre-release"],
  },
  {
    id: 70,
    domain: DEVELOPMENT,
    question:
      "During testing, engineers find a model performs very well on its training data but poorly on new, unseen data. What does this pattern most likely indicate, and what response follows?",
    options: [
      "A privacy incident affecting the training set, requiring notification to the regulator.",
      "A breach of the data supplier's contract, requiring legal review of the licensing terms.",
      "Insufficient server capacity during evaluation, requiring additional hardware before retesting.",
      "Overfitting to the training data, requiring investigation before deployment goes any further.",
    ],
    correct: 3,
    rationale:
      "Strong performance on training data paired with weak performance on new data is the classic signature of overfitting, where the model has learned the training set rather than the underlying pattern. It is a well-understood risk that testing exists to catch, and it should be investigated and addressed before deployment proceeds.",
    tags: ["development", "overfitting", "generalisation", "testing"],
  },
  {
    id: 71,
    domain: DEVELOPMENT,
    question:
      "A team moving a model from testing into production wants to document its intended use, limitations, and performance characteristics in a standardised format for stakeholders. What artefact is it producing?",
    options: [
      "A model card, the standard format for intended use, limitations, and performance.",
      "A software licence agreement, setting out the terms on which the model may be used.",
      "A vendor invoice, recording what was paid for the components used to build the model.",
      "A marketing brochure, describing the model's strengths for prospective internal adopters.",
    ],
    correct: 0,
    rationale:
      "A model card is the standard artefact for communicating a model's intended use, limitations, and performance characteristics before release, supporting both internal governance and external transparency. The other documents are real business artefacts, but none serves the documentation purpose described.",
    tags: ["development", "model card", "documentation", "transparency"],
  },
  {
    id: 72,
    domain: DEVELOPMENT,
    question:
      "A demand forecasting model has run in production for over a year and its predictions have grown noticeably less accurate, though the underlying code has not changed. What explains this, and what addresses it?",
    options: [
      "A security compromise of the inference pipeline, requiring incident response and notification.",
      "Model or data drift, requiring continuous monitoring and a scheduled retraining cadence.",
      "A licensing violation in a training data source, requiring renegotiation with the supplier.",
      "An ownership dispute over the training data, requiring legal review before the model is reused.",
    ],
    correct: 1,
    rationale:
      "Gradual performance decay with no code change points to model or data drift, where real-world conditions move away from the distribution the model was trained on. The standard governance response is continuous monitoring paired with a scheduled programme of maintenance and retraining. The alternatives describe legal and security scenarios the facts do not suggest.",
    tags: ["development", "model drift", "monitoring", "retraining"],
  },
  {
    id: 73,
    domain: DEVELOPMENT,
    question:
      "A company that builds AI systems for other businesses must show how it meets transparency obligations toward the organisations deploying its models. What best satisfies that obligation?",
    options: [
      "Requiring every deployer to sign a nondisclosure agreement before receiving system details.",
      "Publishing marketing material that sets out the model's capabilities and competitive advantages.",
      "Providing technical documentation, instructions for use, and post-market monitoring plans.",
      "Publishing the complete training dataset openly so deployers can inspect it for themselves.",
    ],
    correct: 2,
    rationale:
      "Transparency toward deployers usually means supplying the information they need to operate the system responsibly: technical documentation, instructions for use, and post-market monitoring plans. Promotional material is not governance documentation, a nondisclosure agreement restricts information rather than sharing it, and publishing a training dataset creates fresh risks of its own.",
    tags: ["development", "provider obligations", "documentation", "deployers"],
  },
  {
    id: 74,
    domain: DEPLOYMENT,
    question:
      "Before deploying an AI writing assistant across its support team, a reviewer asks about employee readiness to use the tool appropriately, beyond its technical performance. What is being evaluated?",
    options: [
      "Model architecture, covering how the system is designed internally and where its limits sit.",
      "Workforce readiness, covering the training and understanding needed to use the tool well.",
      "Data availability, covering whether enough representative data exists to support the use case.",
      "Vendor reputation, covering the provider's standing and track record in the wider market.",
    ],
    correct: 1,
    rationale:
      "Assessing a use case's context includes workforce readiness — whether the people who will use a tool have the training and understanding to use it appropriately — alongside business objectives, data availability, and ethical considerations. The other options are genuine considerations from the same area, but they concern data, design, and suppliers rather than people.",
    tags: ["deployment", "workforce readiness", "training", "use case context"],
  },
  {
    id: 75,
    domain: DEPLOYMENT,
    question:
      "A company compares an inspectable, modifiable open-source language model against a closed proprietary model reachable only through an API. What is a governance-relevant difference between them?",
    options: [
      "The open-source model can be assumed more accurate, since its weights are open to scrutiny.",
      "The proprietary model can be assumed compliant, since the vendor accepts regulatory exposure.",
      "Governance obligations attach to proprietary models but not to open-source deployments.",
      "The open-source model offers more direct visibility and control than the proprietary option.",
    ],
    correct: 3,
    rationale:
      "The governance-relevant distinction is the degree of visibility and control available: an open model can be inspected and modified directly, while a proprietary one requires greater reliance on the vendor's documentation and assurances. Licensing model does not determine accuracy, does not confer compliance, and does not switch governance obligations on or off.",
    tags: ["deployment", "open source", "proprietary models", "vendor reliance"],
  },
  {
    id: 76,
    domain: DEPLOYMENT,
    question:
      "A company wants its AI assistant to answer questions using current internal documents, without retraining the model each time those documents change. Which technique best fits?",
    options: [
      "Retrieval augmented generation, letting the model consult the documents at query time.",
      "Fine-tuning the model on the complete document archive on a weekly refresh schedule.",
      "Deploying the model entirely on-premise, with no outbound internet connectivity permitted.",
      "Using the model as supplied, relying on what it already learned during its original training.",
    ],
    correct: 0,
    rationale:
      "Retrieval augmented generation lets a model reference current, approved sources at query time, which removes the need to retrain whenever those sources change and reduces fabricated answers. Weekly fine-tuning is resource-heavy and still lags the documents, on-premise deployment addresses infrastructure location rather than freshness, and an unmodified model has no access to the documents at all.",
    tags: ["deployment", "RAG", "grounding", "knowledge freshness"],
  },
  {
    id: 77,
    domain: DEPLOYMENT,
    question:
      "A company has selected a third-party vendor for a new hiring tool and is about to sign when a governance team member recommends one further step. What is that step?",
    options: [
      "Negotiating a reduction in the annual licensing fee before the agreement is executed.",
      "Performing or reviewing an impact assessment covering the AI system that was selected.",
      "Scheduling an internal launch event so affected teams learn about the tool in good time.",
      "Confirming the vendor's brand will not be visible to candidates during the screening process.",
    ],
    correct: 1,
    rationale:
      "Performing or reviewing an impact assessment on the selected system is the governance step that belongs before a high-stakes deployment such as a hiring tool is contractually locked in. Commercial negotiation, internal communications, and branding are ordinary business activities that do not surface the risks an assessment is designed to find.",
    tags: ["deployment", "impact assessment", "vendor selection", "hiring"],
  },
  {
    id: 78,
    domain: DEPLOYMENT,
    question:
      "A company reviewing an AI vendor contract notices it is silent on who bears responsibility if the system produces a discriminatory outcome that creates legal liability. What should governance do?",
    options: [
      "Assume the vendor bears the liability, since it developed and trained the underlying model.",
      "Proceed to signature, since allocating legal liability is properly a matter for the legal team.",
      "Treat the silence as a key contractual risk and negotiate explicit liability terms before signing.",
      "End the vendor relationship, since a gap this significant indicates the supplier cannot be trusted.",
    ],
    correct: 2,
    rationale:
      "Identifying and evaluating key terms in vendor agreements, liability allocation among them, is a governance responsibility when assessing a system for deployment. Silence is a real risk to be resolved by negotiation rather than assumed away, treated as somebody else's remit, or escalated into ending a relationship that a contract amendment would fix.",
    tags: ["deployment", "vendor contracts", "liability", "negotiation"],
  },
  {
    id: 79,
    domain: DEPLOYMENT,
    question:
      "A financial services company decides to build and deploy its own proprietary credit-scoring model rather than license one. How does that choice generally affect its governance obligations?",
    options: [
      "It reduces them, because the company now controls the model and can change it at will.",
      "It increases them, because the company now carries both developer and deployer responsibilities.",
      "It leaves them unchanged, because obligations follow the use case rather than who built the system.",
      "It transfers them to the sector regulator, which supervises credit-scoring models directly.",
    ],
    correct: 1,
    rationale:
      "Building and deploying a proprietary model means taking on developer-level responsibilities as well as deployer-level ones, where licensing would have left part of that burden with the vendor. Control does not reduce obligation, the distinction is a meaningful one rather than a formality, and regulators supervise organisations rather than absorbing their duties.",
    tags: ["deployment", "build vs buy", "developer duties", "liability"],
  },
  {
    id: 80,
    domain: DEPLOYMENT,
    question:
      "After deploying a fraud-detection model that passed all pre-deployment testing, a bank's governance team debates whether ongoing oversight is still required. What is the correct expectation?",
    options: [
      "No further oversight is needed, since the system cleared every pre-deployment test applied to it.",
      "Oversight should restart only once a customer complaint indicates the model is misbehaving.",
      "Oversight passes to the vendor at the point the system enters production and is handed over.",
      "Continuous monitoring should run alongside a regular maintenance and retraining schedule.",
    ],
    correct: 3,
    rationale:
      "Governing a deployed system includes continuous monitoring and a defined schedule for maintenance, updates, and retraining, because real-world conditions evolve and pre-deployment testing cannot guarantee sustained performance. Treating launch as a finish line, waiting for complaints, or assuming a vendor absorbs the duty all leave the deploying organisation exposed.",
    tags: ["deployment", "continuous monitoring", "post-deployment", "maintenance"],
  },
  {
    id: 81,
    domain: DEPLOYMENT,
    question:
      "A chatbot deployed to answer basic product questions is being used informally by staff to draft internal HR communications, a use never assessed or approved. What risk does this illustrate?",
    options: [
      "Secondary or unintended use, requiring assessment of risks outside the approved scope.",
      "A licensing cost overrun, requiring the vendor agreement to be renegotiated at renewal.",
      "A storage capacity problem, requiring additional infrastructure to handle the extra volume.",
      "An adoption success signal, requiring the tool to be promoted more widely across the business.",
    ],
    correct: 0,
    rationale:
      "Anticipating and reducing the risk of secondary or unintended use is a governance responsibility for deployed systems, because informal uses carry risks that the original assessment never examined. Drafting HR communications raises fairness, confidentiality, and accuracy questions that answering product questions does not.",
    tags: ["deployment", "secondary use", "scope creep", "shadow AI"],
  },
  {
    id: 82,
    domain: DEPLOYMENT,
    question:
      "A regulator in one country issues rules an AI pricing tool cannot meet without modification. The company must respond quickly there while keeping the tool running elsewhere. What control should already exist?",
    options: [
      "A policy shutting the tool down in every market whenever any single jurisdiction changes its rules.",
      "A policy and controls allowing the system to be deactivated or localised where necessary.",
      "A policy barring operation in any jurisdiction whose AI regulation is still actively evolving.",
      "A policy delegating the regulatory response decision to the pricing system's own optimisation logic.",
    ],
    correct: 1,
    rationale:
      "Maintaining a policy and the technical controls to deactivate or localise a deployed system — for instance in response to new requirements in one market — is a named governance responsibility. A global shutdown penalises compliant markets, refusing evolving jurisdictions forecloses most of the world, and regulatory judgement cannot be delegated to the system itself.",
    tags: ["deployment", "deactivation", "localisation", "regulatory change"],
  },
];

const questions = JSON.parse(readFileSync(SOURCE, "utf8"));
const existing = new Set(questions.map((q) => q.id));

for (const q of NEW_QUESTIONS) {
  if (existing.has(q.id)) throw new Error(`q${q.id} already exists`);
  if (q.options.length !== 4) throw new Error(`q${q.id} needs 4 options`);
  questions.push({
    id: q.id,
    domain: q.domain,
    question: q.question,
    options: q.options.map((text, i) => `${LETTERS[i]}. ${text}`),
    correct: LETTERS[q.correct],
    rationale: q.rationale,
    tags: q.tags,
  });
}

writeFileSync(SOURCE, `${JSON.stringify(questions, null, 2)}\n`);
console.log(`added ${NEW_QUESTIONS.length}; bank is now ${questions.length}`);
