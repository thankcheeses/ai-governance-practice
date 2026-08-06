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

export type OptionKey = "A" | "B" | "C" | "D";

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

export interface QuestionOption {
  key: OptionKey;
  text: string;
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
  correctAnswer: OptionKey;
  rationale: string;
  keyTakeaway: string;
  /** Present only where a diagram genuinely aids comprehension. */
  visualAid?: VisualAid;
  frameworkTags: FrameworkTag[];
  /** Free-form topic tags carried through from the source content. */
  tags: string[];
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
  correct: string;
  rationale: string;
  tags?: string[];
}

/**
 * Editorial metadata layered onto each source question.
 *
 * The source JSON is checked in unmodified so question meaning is never
 * altered. Difficulty and framework tags are classifications of the existing
 * item; the key takeaway restates the item's own rationale as a portable rule.
 */
export interface QuestionEnrichment {
  difficulty: Difficulty;
  keyTakeaway: string;
  frameworkTags: FrameworkTag[];
  /** Attached per question as diagram assets are supplied. */
  visualAid?: VisualAid;
}
