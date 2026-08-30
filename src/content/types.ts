/**
 * Track-based content model.
 *
 * A "track" is a self-contained body of learning content. Adding a future track
 * means adding a folder under src/content/tracks/ and registering it — no
 * schema change, no restructuring of the app, no database migration. Questions
 * carry `trackId` so every progress record is naturally scoped to a track.
 *
 * All content is original educational material. See DISCLAIMER in the app.
 */

export type TrackId =
  | "aigp-preparation"
  | "healthcare-ai-governance"
  | "voice-ai-governance"
  | "agentic-ai-governance"
  | "eu-ai-act-operations"
  | "ai-security-governance"
  | "responsible-ai-implementation";

export type TrackStatus = "active" | "planned";

export interface Track {
  id: TrackId;
  name: string;
  /** One line describing what the learner builds by working through it. */
  summary: string;
  /**
   * How the track relates to an outside body of knowledge, stated neutrally.
   * Naming a certification's subject matter is descriptive; claiming
   * affiliation, endorsement, or exam equivalence is not, and must never
   * appear here.
   */
  context?: string;
  /**
   * The three fields below are one controlled maintenance assertion, kept
   * machine-readable so it can be validated rather than trusted.
   *
   * Together they say: *this content was checked against this named authority
   * at this version, on this date.* They do not say the content will remain
   * aligned after it — alignment is a property of the authority's next
   * revision, which is outside our control.
   *
   * Re-check is event-triggered, never calendar-triggered. See
   * docs/bok-maintenance.md; `npm run check:bok` enforces the invariants.
   */
  /** The document that defines what the exam covers. */
  contextAuthority?: string;
  /** That document's version, as the authority labels it. */
  contextVersion?: string;
  /** ISO 8601 date the check was last genuinely performed. */
  contextReviewed?: string;
  /**
   * What the check found, in the form the study page states it. Separate from
   * the three fields above because "we checked the structure" and "we audited
   * the coverage" are different claims and must be able to disagree.
   * Computed and enforced by `npm run check:bok`; never hand-waved.
   */
  contextCoverage?: string;
  status: TrackStatus;
  /** Ordered domain list for this track, derived from its own content. */
  domains: string[];
  questionCount: number;
}

export const DIFFICULTIES = ["foundational", "applied", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_RANK: Record<Difficulty, number> = {
  foundational: 0,
  applied: 1,
  advanced: 2,
};

/** Controlled vocabulary for framework tags across all tracks. */
export const FRAMEWORK_TAGS = [
  "NIST AI RMF",
  "EU AI Act",
  "ISO 42001",
  "Responsible AI",
  "AI Risk Management",
  "AI Governance",
] as const;

export type FrameworkTag = (typeof FRAMEWORK_TAGS)[number];

/**
 * Option labels. E exists for multi-select items, which the certification
 * exam presents as "select N of 5". Single-select items use A-D.
 */
export type OptionKey = "A" | "B" | "C" | "D" | "E";

/**
 * Internal reasoning dimensions.
 *
 * Grouped for implementation only (situation recognition, governance
 * reasoning, decision quality). Never exposed as navigation or dashboard
 * sections. User-facing copy uses plain language derived from these keys.
 */
export type ReasoningDimension =
  | "material_facts"
  | "lifecycle_stage"
  | "governing_obligation"
  | "accountability"
  | "legal_vs_ethical"
  | "risk_prioritization"
  | "sequencing"
  | "proportionality";

/**
 * What a specific distractor typically represents when selected.
 * Used for error classification and near-miss teaching.
 */
export type DistractorType =
  | "missed_material_fact"
  | "wrong_governing_obligation"
  | "wrong_accountable_party"
  | "premature_remediation"
  | "risk_underestimation"
  | "risk_overreaction"
  | "lifecycle_confusion"
  | "legal_ethical_conflation"
  | "technically_correct_but_premature"
  | "plausible_but_incomplete"
  | "secondary_risk_prioritized";

/**
 * Optional reasoning metadata on a question.
 *
 * Enables pattern detection and targeted practice without changing the
 * user-facing navigation. All fields are optional at the enrichment layer;
 * questions without this block continue to function exactly as before.
 */
export interface ReasoningMeta {
  /**
   * Primary skill the question is designed to test.
   *
   * Represents the instructional intent of the item, not an exhaustive
   * description of every reasoning skill exercised. Secondary dimensions may
   * capture meaningful additional skills when justified.
   */
  primaryDimension: ReasoningDimension;
  /** Secondary skills also exercised (0–2 typical). */
  secondaryDimensions?: ReasoningDimension[];
  /**
   * Per-option reasoning pattern.
   * In enrichment files: keyed by source letter ("A"–"E").
   * On normalized Question: keyed by option id.
   */
  distractorTypes?: Partial<Record<string, DistractorType>>;
}

/**
 * Optional diagram attached to a question.
 *
 * Used sparingly and only for systems-thinking items where a diagram removes
 * cognitive load that prose cannot — sequence, responsibility, architecture,
 * decision flow, failure points. Target for v1 is 8-12 questions, never all of
 * them, and never decoration.
 *
 * `src` points at a static asset under /public. Assets are supplied separately;
 * the app renders what exists and shows nothing when the field is absent.
 */
export type VisualAidType =
  | "workflow"
  | "decision-tree"
  | "responsibility-map"
  | "architecture"
  | "timeline";

export interface VisualAid {
  type: VisualAidType;
  src: string;
  /** Required — the diagram must be described for non-visual readers. */
  alt: string;
  caption?: string;
}

/**
 * A fact pattern several questions interrogate.
 *
 * Certification testing at this level is not a definition quiz: a candidate is
 * given an organisation, a system, a lifecycle stage, competing priorities and
 * a set of signals, and has to work out which facts bear on the decision in
 * front of them. A scenario is authored once and its questions attack different
 * dimensions of it — sequencing, accountability, risk priority, control
 * selection, regulatory applicability, monitoring.
 *
 * Two rules keep a family honest:
 *
 *  - every question must be gradable from the scenario alone, so the order
 *    they are met in never matters and no question depends on having answered
 *    a sibling;
 *  - no question may give away another's answer.
 *
 * `sector` exists so the bank's industry balance can be audited rather than
 * assumed — see scripts/check-question-balance.mjs.
 */
export interface Scenario {
  id: string;
  title: string;
  /** Industry or organisational context, e.g. "financial services". */
  sector: string;
  /** The fact pattern, one entry per paragraph. */
  body: string[];
  /**
   * Structured particulars a candidate must read against the prose — monitoring
   * results, jurisdictions, dates, roles. Rendered as a definition list.
   */
  facts?: { label: string; value: string }[];
}

export interface RawScenario {
  id: string;
  title: string;
  sector: string;
  body: string[];
  facts?: { label: string; value: string }[];
}

export interface QuestionOption {
  /**
   * Stable identity, derived from the option's position in the source file
   * and never changing: "aigp-004-o2".
   *
   * Correctness is recorded against this, not against a letter. Options are
   * shuffled per session, so a letter describes where an option happened to
   * land on one screen and means nothing anywhere else.
   */
  id: string;
  text: string;
}

/** An option as presented: the option itself plus the letter it was dealt. */
export interface PresentedOption extends QuestionOption {
  key: OptionKey;
}

/**
 * The normalized question shape used everywhere in the app. Mirrors the
 * `questions` table so client and database stay in step.
 */
export interface Question {
  id: string;
  trackId: TrackId;
  domain: string;
  difficulty: Difficulty;
  question: string;
  options: QuestionOption[];
  /**
   * Ids of every option that must be selected. Length 1 is a single-select
   * item; more than one makes it multi-select, graded all-or-nothing. Arity is
   * derived from this rather than carried as a separate flag, so the two
   * cannot disagree. See lib/grading.ts.
   */
  correctOptionIds: string[];
  rationale: string;
  keyTakeaway: string;
  /** Present only where a diagram genuinely aids comprehension. */
  visualAid?: VisualAid;
  /**
   * The fact pattern this item belongs to, resolved from `scenarioId`.
   * Standalone items have none and read exactly as they always did.
   */
  scenario?: Scenario;
  /**
   * Why each wrong option is wrong, keyed by option id.
   *
   * Kept per option rather than folded into the rationale because most of the
   * learning in a judgement item is in the near-miss: an answer that is a real
   * governance action but the wrong one *here*, or right but out of sequence.
   */
  distractorNotes?: Record<string, string>;
  /**
   * Public sources supporting the rationale — a framework clause, a published
   * standard, a statute article. Present so a learner can check the claim
   * rather than trust it.
   */
  sources?: string[];
  frameworkTags: FrameworkTag[];
  /**
   * The Body of Knowledge sub-domain this item tests, e.g. "III.B".
   *
   * Surfaced onto the question so analytics can resolve an attempt's
   * sub-domain from its `questionId` alone. Deliberately not copied onto
   * `Attempt`: re-mapping a question during a future BoK revision then
   * corrects historical analytics instead of leaving stale values frozen in
   * old rows.
   */
  bokSubdomain: string;
  /** Free-form topic tags carried through from the source content. */
  tags: string[];
  /**
   * Optional reasoning metadata. Absent on unlabeled items.
   * distractorTypes are keyed by option id (normalized from source letters).
   */
  reasoning?: ReasoningMeta;
  createdDate: string;
  updatedDate: string;
}

/** Raw shape of a source JSON record, before normalization. */
export interface RawQuestion {
  id: number;
  domain: string;
  question: string;
  /** Prefixed with "A. ", "B. " and so on in the source file. */
  options: string[];
  /** One key, or several comma-separated for multi-select: "A,C,D". */
  correct: string;
  rationale: string;
  tags?: string[];
  /** Links this item to a fact pattern in scenarios.json. */
  scenarioId?: string;
}

/**
 * Editorial metadata layered onto each source question.
 *
 * The source JSON is checked in unmodified so question meaning is never
 * altered. Difficulty and framework tags are classifications of the existing
 * item; the key takeaway restates the item's own rationale as a portable rule.
 */
export interface QuestionEnrichment {
  /**
   * The AIGP Body of Knowledge sub-domain this item tests, e.g. "III.B".
   *
   * Assigned by reading the item against the published performance indicators,
   * and by what the item actually tests rather than which of the four domains
   * it is filed under — an item can sit in one and test another. This is what
   * makes coverage a computed fact rather than an assertion; `npm run check:bok`
   * derives the traceability matrix from it.
   */
  bokSubdomain: string;
  difficulty: Difficulty;
  keyTakeaway: string;
  frameworkTags: FrameworkTag[];
  /** Attached per question as diagram assets are supplied. */
  visualAid?: VisualAid;
  /**
   * Why each wrong option is wrong, keyed by the source letter ("A", "B", ...)
   * — the same convention `correct` uses. Converted to option ids on load, so
   * the shuffle can never misattribute a note.
   */
  distractorNotes?: Partial<Record<OptionKey, string>>;
  /** Public framework, standard or statute supporting the rationale. */
  sources?: string[];
  /**
   * Optional reasoning metadata. When present, distractorTypes are keyed by
   * source letter (same convention as distractorNotes) and converted to
   * option ids at load time.
   */
  reasoning?: {
    primaryDimension: ReasoningDimension;
    secondaryDimensions?: ReasoningDimension[];
    distractorTypes?: Partial<Record<OptionKey, DistractorType>>;
  };
}
