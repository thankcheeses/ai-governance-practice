import { Fragment } from "react";
import { DEFAULT_LIMIT, markConcepts } from "@/lib/highlight";
import { cn } from "@/lib/utils";

/**
 * Marks governance terms of art in body copy.
 *
 * The point is scanning: a practitioner reading a scenario should be able to
 * find the concept under test without reading every word. Marked terms are set
 * in italic and the brand accent, which reads as emphasis in both themes and
 * survives greyscale — the italic carries the meaning if the colour does not.
 *
 * Which terms mark, and how often, is decided in lib/highlight.ts. Never style
 * a question by hand; add the term to content/concepts.ts and it is marked
 * everywhere it appears.
 */
export function ConceptHighlight({
  text,
  limit = DEFAULT_LIMIT,
  className,
}: {
  text: string;
  /** Maximum marks in this block. Set 0 to render plain text. */
  limit?: number;
  className?: string;
}) {
  const segments = markConcepts(text, limit);

  return (
    <>
      {segments.map((segment, i) =>
        segment.marked ? (
          <em
            key={i}
            className={cn("font-medium italic text-accent-strong", className)}
          >
            {segment.text}
          </em>
        ) : (
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}
