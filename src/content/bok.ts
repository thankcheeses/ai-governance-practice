/**
 * The AIGP Body of Knowledge outline, as published.
 *
 * Domain and competency wording is taken from the authority's own document —
 * naming its subject areas is descriptive, and nothing here claims affiliation
 * or endorsement. `recommendation` is our own study guidance written from the
 * competency's performance indicators; it is editorial, not quoted.
 *
 * Structural facts (which sub-domains exist, which domain each belongs to) live
 * here so analytics and the study surfaces read one list. The version this
 * reflects is recorded on the track in content/registry.ts, and
 * `npm run check:bok` keeps the two consistent.
 */

export const DOMAIN_TITLES = {
  I: "Foundations of AI governance",
  II: "How laws, standards and frameworks apply to AI",
  III: "Governing AI development",
  IV: "Governing AI deployment and use",
} as const;

export type DomainRoman = keyof typeof DOMAIN_TITLES;

/**
 * The published exam blueprint.
 *
 * These are **counts of questions, not percentages**. The source states it
 * plainly: the blueprint numbers "show the minimum and maximum number of
 * questions from each domain that will be found on the exam". They sum to
 * 77–93, not to 100, and writing them as percentages would invent precision the
 * authority did not publish.
 *
 * Ranges, not points. The authority publishes a span per domain because the
 * count varies between exam forms, so any single figure here would be ours
 * rather than theirs. Where a single number is unavoidable — apportioning a
 * drill of a given length — the midpoint is derived at the point of use and
 * labelled as a midpoint, never presented as a published weight.
 */
export interface DomainBlueprint {
  /** Fewest questions from this domain on an exam form. */
  min: number;
  /** Most questions from this domain on an exam form. */
  max: number;
}

/**
 * Source, recorded so the claim is checkable rather than asserted.
 *
 * `npm run check:bok` fails if DOMAIN_BLUEPRINT exists without this block, or
 * if the version here disagrees with the version the track claims in
 * content/registry.ts.
 */
export const BLUEPRINT_SOURCE = {
  document: "AIGP_Cert_BOK_13March2026_FINAL2.PDF",
  title: "The AIGP Body of Knowledge",
  version: "2.1",
  effectiveDate: "2026-02-02",
  approvedBy: "AIGP EDB",
  approvedOn: "2025-09-09",
  supersedes: "2.0.1",
  /** Where in that document the numbers appear. */
  pages: "4-9",
  /** When these numbers were read out of the document and entered here. */
  /**
   * Re-read against the owner's copy of the document on 2026-10-05: every
   * domain range, every competency range, the version, both dates and the
   * supersedes line were confirmed unchanged. The competency wording was not
   * verbatim and is now.
   */
  retrievedOn: "2026-10-05",
} as const;

export const DOMAIN_BLUEPRINT: Record<DomainRoman, DomainBlueprint> = {
  I: { min: 16, max: 20 },
  II: { min: 19, max: 23 },
  III: { min: 21, max: 25 },
  IV: { min: 21, max: 25 },
};

/**
 * The exam blueprint at competency level.
 *
 * The published document carries min/max item counts per competency as well as
 * per domain, and these are read from the same pages as `DOMAIN_BLUEPRINT`.
 * They lived only inside `scripts/check-bok-currency.mjs`, where the app could
 * not reach them — so a blueprint-apportioned sitting could be weighted by
 * domain but never by competency, and the two copies could drift without
 * anything noticing. One home, here, beside the domain figures and the source
 * that justifies both.
 *
 * These are counts the *exam* draws, not a prescription for a practice bank.
 * Nothing here says a 350-question bank should hold 4 to 6 questions on I.A.
 */
export const COMPETENCY_BLUEPRINT: Record<string, DomainBlueprint> = {
  "I.A": { min: 4, max: 6 },
  "I.B": { min: 5, max: 7 },
  "I.C": { min: 6, max: 8 },
  "II.A": { min: 4, max: 6 },
  "II.B": { min: 4, max: 6 },
  "II.C": { min: 6, max: 8 },
  "II.D": { min: 3, max: 5 },
  "III.A": { min: 6, max: 8 },
  "III.B": { min: 6, max: 8 },
  "III.C": { min: 8, max: 10 },
  "IV.A": { min: 6, max: 8 },
  "IV.B": { min: 5, max: 7 },
  "IV.C": { min: 9, max: 11 },
};

export interface SubdomainEntry {
  id: string;
  domain: DomainRoman;
  /** The competency, verbatim from the published Body of Knowledge. */
  competency: string;
  /** Our guidance on what to review when this area is weak. */
  recommendation: string;
}

export const SUBDOMAINS: SubdomainEntry[] = [
  {
    id: "I.A",
    domain: "I",
    competency: "Understand what AI is and why it needs governance",
    recommendation:
      "Review the definitions and types of AI, the harms it can cause, the characteristics that make it hard to govern — opacity, autonomy, scale, probabilistic output — and the responsible AI principles.",
  },
  {
    id: "I.B",
    domain: "I",
    competency: "Establish and communicate organizational expectations for AI governance",
    recommendation:
      "Review governance roles and responsibilities, cross-functional composition, training and awareness, and how developer, provider, deployer and user obligations differ.",
  },
  {
    id: "I.C",
    domain: "I",
    competency: "Establish policies and procedures to apply throughout the AI life cycle",
    recommendation:
      "Review lifecycle oversight policy, which existing policies need updating for AI — data, security, IP — and how third-party risk is managed through procurement, contracts and acceptable use.",
  },
  {
    id: "II.A",
    domain: "II",
    competency: "Understand how existing data privacy laws apply to AI",
    recommendation:
      "Review lawful basis, purpose limitation and transparency as they apply to AI, plus controller duties: impact assessments, processors, cross-border transfers, data subject rights and special categories.",
  },
  {
    id: "II.B",
    domain: "II",
    competency: "Understand how other types of existing laws apply to AI",
    recommendation:
      "Review intellectual property, nondiscrimination across employment, credit, housing and insurance, consumer protection, and product liability as each applies to AI systems.",
  },
  {
    id: "II.C",
    domain: "II",
    competency: "Understand the main elements of AI-specific laws",
    recommendation:
      "Review risk classification and prohibited practices, the obligations attaching to high-risk systems, requirements for general-purpose models, enforcement and penalties, and how duties differ by role in the value chain.",
  },
  {
    id: "II.D",
    domain: "II",
    competency: "Understand the main industry standards and tools that apply to AI",
    recommendation:
      "Review the major voluntary frameworks and standards — what each is for, how they differ, and which are certifiable.",
  },
  {
    id: "III.A",
    domain: "III",
    competency: "Govern the designing and building of the AI system",
    recommendation:
      "Review use case definition, impact assessment at design time, risk mitigation hierarchies, metric and threshold selection, stakeholder engagement, and design documentation.",
  },
  {
    id: "III.B",
    domain: "III",
    competency: "Govern the collection and use of data in training and testing the AI model and system",
    recommendation:
      "Review data governance and lawful rights to use data, lineage and provenance, data quality and fitness for purpose, and how training and testing are planned, run and documented.",
  },
  {
    id: "III.C",
    domain: "III",
    competency: "Govern the release, monitoring and maintenance of the AI system",
    recommendation:
      "Review release readiness and conformity, continuous monitoring with a retraining schedule, periodic assessment through audits and red teaming, incident documentation, and disclosures to deployers.",
  },
  {
    id: "IV.A",
    domain: "IV",
    competency: "Evaluate key factors and risks relevant to the decision to deploy the AI system",
    recommendation:
      "Review use case context including data availability and workforce readiness, the differences between model types, and deployment options — hosting, fine-tuning, retrieval and agentic architectures.",
  },
  {
    id: "IV.B",
    domain: "IV",
    competency: "Perform key activities to assess the AI system",
    recommendation:
      "Review impact assessment of a selected system, evaluation of vendor and licensing terms, and the additional obligations that follow from deploying a model you built yourself.",
  },
  {
    id: "IV.C",
    domain: "IV",
    competency: "Govern the deployment and use of the AI system",
    recommendation:
      "Review applying policy at deployment: data governance, risk and issue management, user training, human oversight in operation, transparency to users, and monitoring for secondary use.",
  },
];

export type SubdomainId = (typeof SUBDOMAINS)[number]["id"];

/** The domain a sub-domain id belongs to, e.g. "III.B" → "III". */
export function domainOf(subdomainId: string): DomainRoman | undefined {
  const roman = subdomainId.split(".")[0] as DomainRoman;
  return roman in DOMAIN_TITLES ? roman : undefined;
}
