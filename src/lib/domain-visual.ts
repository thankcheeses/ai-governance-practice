/**
 * Presentation-only visual identity for AIGP domains.
 *
 * Colour is a scanning aid, not a ranking. Each domain gets a stable accent
 * from the Civic Studio palette so lists and progress surfaces can be
 * distinguished without implying importance. Meaning is never colour-only:
 * every use pairs tint with a label, number, or mark.
 */

export type DomainTone = "ink" | "accent" | "insight" | "support";

export interface DomainVisual {
  /** Short roman index for scanning (I–IV). */
  roman: "I" | "II" | "III" | "IV";
  /**
   * A few words for a control, where the authored domain name is too long to
   * sit on a button. Presentation only — never stored, never sent, and never
   * used to look a domain up; the full name remains the key everywhere.
   */
  short: string;
  /** Civic Studio semantic tone — maps to existing CSS tokens. */
  tone: DomainTone;
  /** Soft surface behind domain rows/cards. */
  surfaceClass: string;
  /** Left rule / progress fill. */
  accentClass: string;
  /** Chip / badge text on tint. */
  chipClass: string;
}

const BY_NAME: Record<string, DomainVisual> = {
  "Foundations of AI Governance": {
    short: "Foundations",
    roman: "I",
    tone: "ink",
    surfaceClass: "bg-secondary/60",
    accentClass: "bg-primary",
    chipClass: "border-border-strong bg-secondary text-foreground",
  },
  "Laws, Standards, and Frameworks": {
    short: "Laws & frameworks",
    roman: "II",
    tone: "accent",
    surfaceClass: "bg-accent-tint/70",
    accentClass: "bg-accent",
    chipClass: "border-accent/30 bg-accent-tint text-accent-foreground",
  },
  "Governing AI Development": {
    short: "Development",
    roman: "III",
    tone: "insight",
    surfaceClass: "bg-insight-tint/80",
    accentClass: "bg-insight",
    chipClass: "border-insight/25 bg-insight-tint text-insight-foreground",
  },
  "Governing AI Deployment and Use": {
    short: "Deployment & use",
    roman: "IV",
    tone: "support",
    surfaceClass: "bg-success-tint/70",
    accentClass: "bg-success",
    chipClass: "border-success/30 bg-success-tint text-success",
  },
};

const FALLBACK: DomainVisual = {
  roman: "I",
  short: "Practice",
  tone: "ink",
  surfaceClass: "bg-secondary/50",
  accentClass: "bg-primary",
  chipClass: "border-border bg-secondary text-muted-foreground",
};

/**
 * The four domains in blueprint order.
 *
 * Exported so a control can offer every domain without re-deriving the list
 * from the bank on each render. `domain-visual.test.ts` asserts this matches
 * the bank exactly, because these strings are routed on — a name that drifted
 * would not merely lose a colour, it would deal an empty session.
 */
export const DOMAIN_NAMES = [
  "Foundations of AI Governance",
  "Laws, Standards, and Frameworks",
  "Governing AI Development",
  "Governing AI Deployment and Use",
] as const;

export function domainVisual(domain: string): DomainVisual {
  return BY_NAME[domain] ?? FALLBACK;
}
