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
    roman: "I",
    tone: "ink",
    surfaceClass: "bg-secondary/60",
    accentClass: "bg-primary",
    chipClass: "border-border-strong bg-secondary text-foreground",
  },
  "Laws, Standards, and Frameworks": {
    roman: "II",
    tone: "accent",
    surfaceClass: "bg-accent-tint/70",
    accentClass: "bg-accent",
    chipClass: "border-accent/30 bg-accent-tint text-accent-foreground",
  },
  "Governing AI Development": {
    roman: "III",
    tone: "insight",
    surfaceClass: "bg-insight-tint/80",
    accentClass: "bg-insight",
    chipClass: "border-insight/25 bg-insight-tint text-insight-foreground",
  },
  "Governing AI Deployment and Use": {
    roman: "IV",
    tone: "support",
    surfaceClass: "bg-success-tint/70",
    accentClass: "bg-success",
    chipClass: "border-success/30 bg-success-tint text-success",
  },
};

const FALLBACK: DomainVisual = {
  roman: "I",
  tone: "ink",
  surfaceClass: "bg-secondary/50",
  accentClass: "bg-primary",
  chipClass: "border-border bg-secondary text-muted-foreground",
};

export function domainVisual(domain: string): DomainVisual {
  return BY_NAME[domain] ?? FALLBACK;
}
