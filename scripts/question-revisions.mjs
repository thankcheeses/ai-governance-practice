/**
 * Replacement option sets for the AIGP Preparation bank.
 *
 * The shipped bank leaked its answers two ways: 96% of correct answers were "B"
 * (option "A" was never correct once), and the correct option was the single
 * longest in 43 of 50 questions. Either tell alone let a test-taker score far
 * above chance without reading the stem.
 *
 * Every revision here keeps the question stem, rationale, tags, id, and domain
 * untouched, and keeps the *meaning* of the correct answer so each existing
 * rationale still explains it. What changes is the three distractors — now
 * defensible positions a practitioner might actually argue for — and the letter
 * the answer sits on.
 *
 * Applied by scripts/apply-question-revisions.mjs; enforced by
 * scripts/check-question-balance.mjs.
 */

/** id -> { options: [4 texts, no letter prefix], correct: letter } */
export const REVISIONS = {
  1: {
    options: [
      "It integrates with scheduling systems that already fall under existing clinical software validation policy.",
      "It processes protected health information, which existing privacy controls were not written to cover.",
      "Its responses are probabilistic and can vary even when the same input is presented twice.",
      "It was assembled from third-party components whose release cycles the organization does not control.",
    ],
    correct: "C",
  },
  2: {
    options: [
      "A qualified clinician retains final authority over any recommendation the system surfaces.",
      "The system routes each interaction to the queue with the shortest current wait time.",
      "The system revises its own prompts as it observes which phrasings resolve calls fastest.",
      "The system is tuned for the lowest achievable response latency across all call types.",
    ],
    correct: "A",
  },
  3: {
    options: [
      "A senior data scientist owns model decisions and consults other functions on request.",
      "The vendor's reference governance model is adopted directly to shorten time to deployment.",
      "Governance review is scheduled once production call volume stabilises after launch.",
      "A standing cross-functional group holds clinical, privacy, compliance, and engineering seats.",
    ],
    correct: "D",
  },
  4: {
    options: [
      "Limited risk, because the system informs scheduling staff rather than deciding care itself.",
      "High-risk, because it governs access to an essential service and triggers conformity duties.",
      "Minimal risk, because a clinician confirms every appointment the system proposes.",
      "Prohibited, because it applies automated scoring to patients without their explicit consent.",
    ],
    correct: "B",
  },
  5: {
    options: [
      "Govern, which sets the culture, policies, and accountability the other functions depend on.",
      "Map, which establishes the context and categorises risks before controls are selected.",
      "Measure, which defines the metrics and testing that demonstrate controls are working.",
      "Manage, which allocates resources and decides which identified risks are treated first.",
    ],
    correct: "A",
  },
  6: {
    options: [
      "The EU AI Act, which sets the transparency baseline for conversational systems handling health data.",
      "Sectoral consumer protection rules, which govern automated communications with plan members.",
      "HIPAA and applicable state privacy law, alongside any AI-specific obligations that attach.",
      "Contract and IP law, which determine how transcripts and derived model outputs may be reused.",
    ],
    correct: "C",
  },
  7: {
    options: [
      "ISO/IEC 27001, extended with AI-specific controls through its Annex A tailoring process.",
      "NIST SP 800-53, whose control families are mapped to AI risk in the accompanying overlays.",
      "SOC 2, whose Trust Services Criteria are attested annually by an independent auditor.",
      "ISO/IEC 42001, which specifies requirements for a certifiable AI management system.",
    ],
    correct: "D",
  },
  8: {
    options: [
      "An impact assessment examining affected populations and plausible disparate outcomes.",
      "A representativeness review of the call recordings against the served member population.",
      "A model architecture selection study comparing candidate approaches on held-out data.",
      "A data retention review confirming the recordings may lawfully be kept for training use.",
    ],
    correct: "A",
  },
  9: {
    options: [
      "Zip-code values change as postal boundaries are redrawn, degrading the feature over time.",
      "Zip-code coverage is uneven across the member base, leaving gaps in some regions.",
      "Zip code can act as a proxy for protected characteristics such as race or income.",
      "Zip code is derived from member records rather than collected for this stated purpose.",
    ],
    correct: "C",
  },
  10: {
    options: [
      "A data lineage report, which traces each training field back to its system of record.",
      "An incident response runbook, which defines escalation once the model misbehaves in production.",
      "A validation report, which records measured performance against the acceptance thresholds.",
      "A model card, which states intended use, performance, limitations, and ethical considerations.",
    ],
    correct: "D",
  },
  11: {
    options: [
      "Differential privacy, which bounds how much any single record can influence the output.",
      "K-anonymity, which ensures each record is indistinguishable from a set of similar records.",
      "Tokenisation, which substitutes identifiers with values that carry no intrinsic meaning.",
      "Federated learning, which trains across sites so raw records never leave their origin.",
    ],
    correct: "A",
  },
  12: {
    options: [
      "Whether the licence terms permit the partner's data to be used for model training at all.",
      "Whether the combined datasets use compatible coding schemes for diagnoses and procedures.",
      "Re-identification and leakage risk arising once the de-identified set is joined to clinical notes.",
      "Whether the partner's de-identification method meets the Expert Determination standard.",
    ],
    correct: "C",
  },
  13: {
    options: [
      "Latent overfitting, where memorised training patterns surface only under production traffic.",
      "Capacity saturation, where inference queues lengthen as concurrent call volume grows.",
      "Prompt regression, where an untracked template change altered the agent's behaviour.",
      "Data or concept drift, where production inputs or their relationship to outcomes have shifted.",
    ],
    correct: "D",
  },
  14: {
    options: [
      "Access to logs, performance metrics, and the information needed to evaluate fairness.",
      "A service level agreement committing the vendor to defined uptime and response times.",
      "Notice and approval rights before the vendor changes the underlying model version.",
      "Indemnification covering third-party claims arising from the model's generated outputs.",
    ],
    correct: "A",
  },
  15: {
    options: [
      "Retrain on rebalanced data so the disparity is corrected before it can affect more members.",
      "Suspend the affected model pathway until the cause of the disparity has been established.",
      "Notify cross-functional stakeholders and rapidly assess the scope of potential harm.",
      "Commission an independent bias audit to validate the finding before acting internally.",
    ],
    correct: "C",
  },
  16: {
    options: [
      "Logging every conversation so that identity questions can be reviewed after the fact.",
      "Training the agent to answer truthfully whenever a caller asks whether it is a person.",
      "Adding an audible tone at the start of the call to signal automated call handling.",
      "Requiring the agent to disclose its non-human identity at the start of the interaction.",
    ],
    correct: "D",
  },
  17: {
    options: [
      "Answer using general medical information while noting it is not personalised advice.",
      "Escalate to a qualified human clinician under predefined safe-escalation rules.",
      "Record the symptom description and route it to the member's care team for follow-up.",
      "Redirect the member to the plan's published self-service symptom checker instead.",
    ],
    correct: "B",
  },
  18: {
    options: [
      "Continuous evaluation of outputs against defined content policies, with sampling and automated checks.",
      "Tracking containment and escalation rates as a proxy for how well the agent is performing.",
      "Reviewing every transcript that a member subsequently complained about or disputed.",
      "Comparing weekly response latency and call-handling volume against baseline thresholds.",
    ],
    correct: "A",
  },
  19: {
    options: [
      "It shortens handling time by setting caller expectations before authentication begins.",
      "It satisfies the transparency obligations that attach to high-risk systems under the EU AI Act.",
      "It prevents a false belief that the caller is speaking to a human before PHI is disclosed.",
      "It creates an auditable record that the required notice was delivered on every call.",
    ],
    correct: "C",
  },
  20: {
    options: [
      "A retention control that determines how long call audio may be stored before deletion.",
      "A routing filter that screens inbound calls before they reach the conversational agent.",
      "A redaction step that strips identifiers from transcripts before they are logged.",
      "A control enforcing required disclosure and authorisation before sensitive data is accessed.",
    ],
    correct: "D",
  },
  21: {
    options: [
      "Vendor B, because disclosure and escalation support reduce deception risk and aid accountability.",
      "Vendor A, because a more natural interaction raises member satisfaction and completion rates.",
      "Either, provided the deploying organisation configures its own disclosure script on top.",
      "Vendor A, because disclosure can be added later once the deployment has proven itself.",
    ],
    correct: "A",
  },
  22: {
    options: [
      "Logs of authentication attempts and escalations, held by the vendor and available on request.",
      "Full call audio retained indefinitely so any interaction can be reconstructed on demand.",
      "Protected logs of disclosure, data access, escalation, and outcome, kept per retention rules.",
      "Reliance on the vendor's SOC 2 attestation in place of customer-side event logging.",
    ],
    correct: "C",
  },
  23: {
    options: [
      "Data minimisation, by limiting what the agent may collect during a clinical exchange.",
      "Human oversight, by routing out-of-scope and high-risk requests to a qualified person.",
      "Purpose limitation, by confining the agent to the use case it was authorised for.",
      "Fail-safe design, by defaulting to the least harmful action when the agent is uncertain.",
    ],
    correct: "B",
  },
  24: {
    options: [
      "Whether the platform's models are trained on data comparable to the deploying population.",
      "Whether the platform can meet the latency and concurrency the call centre requires.",
      "Whether the vendor will contractually accept liability for incorrect agent responses.",
      "Whether it supports disclosure, audit access, and customer-enforced escalation policies.",
    ],
    correct: "D",
  },
  25: {
    options: [
      "Treat it as a control failure, find root cause, restore disclosure, and assess who was affected.",
      "Roll back to the previous model version and defer analysis until the next release cycle.",
      "Add a compensating control requiring agents to confirm identity when a member asks.",
      "Log the defect for the vendor and monitor whether the behaviour recurs at scale.",
    ],
    correct: "A",
  },
  26: {
    options: [
      "The model is retrained on a schedule, causing its outputs to change between versions.",
      "The model is promoted across environments, so behaviour differs between staging and production.",
      "Performance degrades over time because the relationship between inputs and outcomes has changed.",
      "The model's confidence scores become poorly calibrated even though accuracy is unchanged.",
    ],
    correct: "C",
  },
  27: {
    options: [
      "The right to data portability, allowing the individual to move their record to another controller.",
      "The right to erasure, requiring the controller to delete the data behind the decision.",
      "The right of access, allowing the individual to obtain the personal data being processed.",
      "The right to human intervention, to express a view, and to contest the decision.",
    ],
    correct: "D",
  },
  28: {
    options: [
      "To document the system's design decisions so they can be reproduced by a later team.",
      "To anticipate and manage potential harms to individuals and groups across the lifecycle.",
      "To establish whether the project's expected benefits justify its development cost.",
      "To determine which regulatory regime the finished system will ultimately fall under.",
    ],
    correct: "B",
  },
  29: {
    options: [
      "Notify the provider and the market surveillance authority per the Act's reporting duties.",
      "Withdraw the system from service and preserve the logs pending internal investigation.",
      "Complete a root-cause analysis so the notification can describe the confirmed defect.",
      "Inform the affected individuals directly before making any regulatory notification.",
    ],
    correct: "A",
  },
  30: {
    options: [
      "Evaluating candidate models against a held-out test set representative of the population.",
      "Establishing continuous monitoring thresholds that will govern the system in production.",
      "Defining the business context and conducting an initial impact assessment.",
      "Red-teaming the system with adversarial inputs to surface unsafe response patterns.",
    ],
    correct: "C",
  },
  31: {
    options: [
      "It reduces the volume of training data needed to reach acceptable response quality.",
      "It isolates member data from the model provider by keeping retrieval entirely on-premise.",
      "It lowers inference cost by shortening the prompts the language model must process.",
      "It grounds responses in current approved sources, reducing fabricated answers.",
    ],
    correct: "D",
  },
  32: {
    options: [
      "Accountability, which assigns named ownership for decisions made across the lifecycle.",
      "Transparency and explainability, which make inputs, outputs, and logic understandable.",
      "Contestability, which gives affected people a route to challenge an automated outcome.",
      "Traceability, which preserves the record of how a given output came to be produced.",
    ],
    correct: "B",
  },
  33: {
    options: [
      "Scope limits in system instructions, boundary testing before release, and runtime escalation.",
      "A post-call review process that flags clinical discussions for compliance follow-up.",
      "A curated knowledge base that contains no clinical treatment content for retrieval.",
      "A classifier that screens member utterances and suppresses clinical responses inline.",
    ],
    correct: "A",
  },
  34: {
    options: [
      "The NIST Cybersecurity Framework, extended with profiles covering AI system risk.",
      "The NIST Privacy Framework, which addresses data-processing risk in AI contexts.",
      "NIST ARIA, which assesses AI risks and impacts through testing and evaluation.",
      "NIST SP 800-53, whose control catalogue includes an AI-specific control family.",
    ],
    correct: "C",
  },
  35: {
    options: [
      "As a permanent substitute for real records once statistical fidelity has been demonstrated.",
      "As a validation set for confirming production performance without touching live data.",
      "As a means of satisfying minimisation duties by never processing real records at all.",
      "To address data scarcity or reduce privacy exposure during development and testing.",
    ],
    correct: "D",
  },
  36: {
    options: [
      "Overfitting, where the model reproduces training examples rather than generalising.",
      "Hallucination, where the model produces fluent but fabricated or incorrect content.",
      "Prompt injection, where retrieved content overrides the agent's original instructions.",
      "Miscalibration, where the model's stated confidence does not match its actual accuracy.",
    ],
    correct: "B",
  },
  37: {
    options: [
      "Clearly defined roles and responsibilities across design, deployment, and oversight.",
      "An independent audit performed annually against the organisation's AI policy set.",
      "Executive sign-off recorded at each stage gate before the system may progress.",
      "Contractual allocation of liability between the deployer and the platform vendor.",
    ],
    correct: "A",
  },
  38: {
    options: [
      "To measure response quality against the benchmark suite used during model selection.",
      "To confirm the system meets its latency targets when placed under peak concurrent load.",
      "To surface vulnerabilities and failure modes by deliberately stressing the system.",
      "To validate that escalation rules fire correctly for every defined out-of-scope topic.",
    ],
    correct: "C",
  },
  39: {
    options: [
      "State biometric privacy statutes, where the system processes voice or facial data.",
      "Contract law, which governs the terms under which the tool was licensed for use.",
      "Trade secret law, which protects the scoring logic from disclosure to candidates.",
      "Federal and state nondiscrimination and employment law, such as Title VII.",
    ],
    correct: "D",
  },
  40: {
    options: [
      "Humans curated the training corpus and labelled the examples the model learned from.",
      "A qualified human reviews and can approve, modify, or override outputs before they act.",
      "Human reviewers audit a sample of completed interactions on a defined cadence.",
      "A human is available on standby and is contacted whenever the system reports low confidence.",
    ],
    correct: "B",
  },
  41: {
    options: [
      "Disaggregating performance and outcome metrics by group and investigating disparities.",
      "Confirming that demographic attributes were excluded from the model's input features.",
      "Comparing aggregate satisfaction scores before and after the agent was introduced.",
      "Verifying the training corpus matched population proportions for each demographic group.",
    ],
    correct: "A",
  },
  42: {
    options: [
      "It demonstrates that the training data was lawfully licensed for the intended purpose.",
      "It allows the training set to be reconstructed exactly if the original store is lost.",
      "It supports traceability and quality assessment, and enables investigation of issues.",
      "It records which fields were transformed so feature engineering can be reproduced.",
    ],
    correct: "C",
  },
  43: {
    options: [
      "Least-privilege access, by restricting which records the agent may read during a call.",
      "Separation of duties, by ensuring no single actor both proposes and approves a change.",
      "Purpose limitation, by tying each permitted action to the purpose disclosed to the member.",
      "Risk-based scope limitation, with human escalation for higher-stakes actions.",
    ],
    correct: "D",
  },
  44: {
    options: [
      "They operate without the change-control gates that traditional software releases pass through.",
      "Once deployed they reach many people quickly and can propagate errors before detection.",
      "They are harder to test exhaustively because their input space cannot be fully enumerated.",
      "They are typically deployed by teams with less operational experience than IT functions.",
    ],
    correct: "B",
  },
  45: {
    options: [
      "The model provider, while the deployer remains responsible for fine-tuning data and context.",
      "The deploying organisation, since it selected the model and controls the member relationship.",
      "Both parties jointly and equally, as the Act treats the supply chain as a single controller.",
      "The cloud provider hosting the model, as the operator of the processing infrastructure.",
    ],
    correct: "A",
  },
  46: {
    options: [
      "Accountability, by creating a record of what the member was told at the start of the call.",
      "Fairness, by ensuring every member receives identical treatment regardless of channel.",
      "Transparency, by making the nature of the system apparent to the person interacting with it.",
      "Human oversight, by prompting the member to request a person if they would prefer one.",
    ],
    correct: "C",
  },
  47: {
    options: [
      "To establish which post-market monitoring obligations will apply after the system launches.",
      "To register the system in the EU database before it becomes available to deployers.",
      "To obtain the technical documentation the provider must supply to downstream deployers.",
      "To demonstrate the system meets requirements for safety, transparency, and risk management.",
    ],
    correct: "D",
  },
  48: {
    options: [
      "Retrain the underlying model so the revised prior-authorisation rules are learned directly.",
      "Refresh the grounded policy content the retrieval layer draws on, then validate the change.",
      "Add a disclaimer advising members to confirm authorisation requirements with a representative.",
      "Restrict the agent from answering prior-authorisation questions until the next model release.",
    ],
    correct: "B",
  },
  49: {
    options: [
      "AI governance operates alongside and must be integrated with existing legal obligations.",
      "AI governance supersedes prior obligations where the two impose conflicting requirements.",
      "Existing obligations apply only where the AI system processes personal data directly.",
      "AI governance is voluntary until sector regulators issue binding AI-specific rules.",
    ],
    correct: "A",
  },
  50: {
    options: [
      "Identity disclosure on request, defined scope limits, and post-call quality sampling.",
      "A highly natural voice, broad topic coverage, and escalation whenever a member asks.",
      "Identity disclosure up front, scope limits, safe escalation, and auditable event logging.",
      "Full automation of routine and clinical requests, with logging retained for later audit.",
    ],
    correct: "C",
  },
};
