"use client";

import type { Question } from "@/content/types";
import { RmfLoop } from "./rmf-loop";
import { VendorChain } from "./vendor-chain";
import { IncidentPath } from "./incident-path";
import { DriftCompare } from "./drift-compare";

/**
 * Resolves a compact instructional visual for a question when the concept
 * benefits from one.
 *
 * Matching is conservative: only when tags / framework tags / key takeaway
 * clearly point at a diagram we already have. No visual is invented, and
 * the absence of a match is the correct default (most questions stay text).
 *
 * Placement: after the key takeaway inside FeedbackPanel so the visual
 * reinforces the portable rule rather than competing with the verdict.
 */

type VisualKind = "rmf" | "vendor" | "incident" | "drift";

function resolveKind(question: Question): VisualKind | null {
  const haystack = [
    ...question.frameworkTags,
    ...question.tags,
    question.keyTakeaway,
    question.rationale,
  ]
    .join(" ")
    .toLowerCase();

  // Order matters: more specific first.
  if (
    /model drift|concept drift|data drift|covariate shift|distribution shift/.test(
      haystack,
    )
  ) {
    return "drift";
  }
  if (
    /incident|escalat|contain|breach|post-incident|incident response/.test(
      haystack,
    )
  ) {
    return "incident";
  }
  if (
    /vendor|subprocessor|third.?party|b\.?a\.?a|processor|procurement|supply.?chain/.test(
      haystack,
    )
  ) {
    return "vendor";
  }
  if (
    /nist ai rmf|ai rmf|govern.?map.?measure.?manage|risk management framework/.test(
      haystack,
    )
  ) {
    return "rmf";
  }
  return null;
}

export function ConceptVisual({
  question,
  className,
}: {
  question: Question;
  className?: string;
}) {
  const kind = resolveKind(question);
  if (!kind) return null;

  switch (kind) {
    case "rmf":
      return <RmfLoop className={className} />;
    case "vendor":
      return <VendorChain className={className} />;
    case "incident":
      return <IncidentPath className={className} />;
    case "drift":
      return <DriftCompare className={className} />;
    default:
      return null;
  }
}
