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

export interface SubdomainEntry {
  id: string;
  domain: DomainRoman;
  /** The competency, in the authority's wording. */
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
    competency: "Establish and communicate organizational expectations",
    recommendation:
      "Review governance roles and responsibilities, cross-functional composition, training and awareness, and how developer, provider, deployer and user obligations differ.",
  },
  {
    id: "I.C",
    domain: "I",
    competency: "Establish policies and procedures across the life cycle",
    recommendation:
      "Review lifecycle oversight policy, which existing policies need updating for AI — data, security, IP — and how third-party risk is managed through procurement, contracts and acceptable use.",
  },
  {
    id: "II.A",
    domain: "II",
    competency: "How existing data privacy laws apply to AI",
    recommendation:
      "Review lawful basis, purpose limitation and transparency as they apply to AI, plus controller duties: impact assessments, processors, cross-border transfers, data subject rights and special categories.",
  },
  {
    id: "II.B",
    domain: "II",
    competency: "How other types of existing laws apply to AI",
    recommendation:
      "Review intellectual property, nondiscrimination across employment, credit, housing and insurance, consumer protection, and product liability as each applies to AI systems.",
  },
  {
    id: "II.C",
    domain: "II",
    competency: "Main elements of AI-specific laws",
    recommendation:
      "Review risk classification and prohibited practices, the obligations attaching to high-risk systems, requirements for general-purpose models, enforcement and penalties, and how duties differ by role in the value chain.",
  },
  {
    id: "II.D",
    domain: "II",
    competency: "Main industry standards and tools",
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
    competency: "Govern data in training and testing",
    recommendation:
      "Review data governance and lawful rights to use data, lineage and provenance, data quality and fitness for purpose, and how training and testing are planned, run and documented.",
  },
  {
    id: "III.C",
    domain: "III",
    competency: "Govern release, monitoring and maintenance",
    recommendation:
      "Review release readiness and conformity, continuous monitoring with a retraining schedule, periodic assessment through audits and red teaming, incident documentation, and disclosures to deployers.",
  },
  {
    id: "IV.A",
    domain: "IV",
    competency: "Evaluate factors and risks in the decision to deploy",
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
