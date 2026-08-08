import { CONCEPT_TERMS_BY_LENGTH } from "@/content/concepts";

/**
 * Splitting body copy into plain runs and marked terms of art.
 *
 * Kept out of the component so the rule — which terms mark, how often, and in
 * what order — can be asserted directly rather than through a rendered tree.
 * `<ConceptHighlight>` is the renderer; this is the decision.
 */

export interface Segment {
  text: string;
  /** True when this run is a governance term worth setting apart. */
  marked: boolean;
}

/** How many terms may be marked in one block before marking stops meaning anything. */
export const DEFAULT_LIMIT = 4;

/** Escape a term for use inside a RegExp. */
function escape(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Built once. Alternation is ordered longest-first so "AI impact assessment"
 * wins over "impact assessment", and \b keeps "provider" from matching inside
 * another word.
 */
const PATTERN = new RegExp(
  `\\b(${CONCEPT_TERMS_BY_LENGTH.map(escape).join("|")})\\b`,
  "gi",
);

/**
 * Two rules, both about restraint:
 *
 *  - a term marks at most once per block, because the second occurrence of the
 *    same phrase teaches nothing and doubles the noise;
 *  - a block marks at most `limit` terms, because past a few the eye stops
 *    reading marks as signal and the paragraph just looks striped.
 *
 * Everything after the limit is returned as ordinary text, so the copy is
 * always complete — marking never drops a word.
 */
export function markConcepts(text: string, limit = DEFAULT_LIMIT): Segment[] {
  if (limit <= 0 || !text) return text ? [{ text, marked: false }] : [];

  const segments: Segment[] = [];
  const seen = new Set<string>();
  let cursor = 0;
  let marked = 0;

  PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PATTERN.exec(text)) !== null && marked < limit) {
    const term = match[0];
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), marked: false });
    }
    segments.push({ text: term, marked: true });
    cursor = match.index + term.length;
    marked += 1;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), marked: false });
  }
  return segments;
}
