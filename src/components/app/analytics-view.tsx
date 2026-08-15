"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { domainOf, type DomainRoman } from "@/content/bok";
import type { Band, FocusArea, Slice } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Study analytics.
 *
 * A read-only view over the calculation layer in lib/analytics. The point is
 * the recommendation, not the bar: a percentage tells a learner they are weak
 * somewhere, and only the recommendation tells them what to read.
 *
 * Colour is a signal here, as everywhere in this system — but it is never the
 * only signal. Every band carries a text label too, so the meaning survives
 * greyscale, colour blindness, and a phone in sunlight.
 */

const BAND_LABEL: Record<Band, string> = {
  strong: "Strong",
  moderate: "Review",
  focus: "Focus",
};

/** Fill colours. `--warning` and `--success` already clear AA in both themes. */
const BAND_FILL: Record<Band, string> = {
  strong: "bg-success",
  moderate: "bg-warning",
  focus: "bg-destructive",
};

const BAND_TEXT: Record<Band, string> = {
  strong: "text-success",
  moderate: "text-warning",
  focus: "text-destructive",
};

/** A labelled bar. Rendered at its value — drawn, not animated. */
function Meter({ slice }: { slice: Slice }) {
  const measured = slice.answered > 0;
  return (
    <div
      role="img"
      aria-label={`${slice.label}: ${
        measured
          ? `${slice.accuracy}% across ${slice.answered} answered, ${BAND_LABEL[slice.band]}`
          : "not started"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm">{slice.label}</span>
        <span className="shrink-0 text-sm tabular-nums">
          {measured ? (
            <>
              <span className={BAND_TEXT[slice.band]}>{slice.accuracy}%</span>
              <span className="ml-2 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground">
                {BAND_LABEL[slice.band]}
              </span>
            </>
          ) : (
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground">
              Not started
            </span>
          )}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full bg-secondary ring-1 ring-inset ring-border-strong">
        {measured ? (
          <div
            className={cn("h-full", BAND_FILL[slice.band])}
            style={{ width: `${slice.accuracy}%` }}
          />
        ) : null}
      </div>
      <p className="mt-1 text-[0.6875rem] text-muted-foreground">
        {slice.answered} answered · {slice.seen} of {slice.available} seen
      </p>
    </div>
  );
}

function Headline({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold leading-tight">{value}</div>
    </div>
  );
}

export function AnalyticsView({
  overall,
  domains,
  subdomains,
  focus,
  strongest,
  weakest,
}: {
  overall: { answered: number; correct: number; accuracy: number; seen: number; available: number };
  domains: (Slice & { roman: DomainRoman })[];
  subdomains: Slice[];
  focus: FocusArea[];
  strongest?: Slice;
  weakest?: Slice;
}) {
  const [open, setOpen] = useState<DomainRoman | null>(null);

  return (
    <div className="space-y-7">
      {/* Overall */}
      <section>
        <h2 className="mb-3 font-mono text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Overall performance
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Headline label="Overall score" value={`${overall.accuracy}%`} />
          <Headline
            label="Questions answered"
            value={`${overall.seen} / ${overall.available}`}
          />
          <Headline
            label="Strongest area"
            value={strongest ? `${strongest.id} · ${strongest.accuracy}%` : "Not yet measured"}
          />
          <Headline
            label="Needs attention"
            value={weakest ? `${weakest.id} · ${weakest.accuracy}%` : "Not yet measured"}
          />
        </div>
      </section>

      {/* Focus areas — the recommendation is the product, not the bar. */}
      {focus.length > 0 ? (
        <section>
          <h2 className="mb-3 font-mono text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Focus areas
          </h2>
          <div className="rule-y border border-border">
            {focus.map((area, i) => (
              <div key={area.id} className="bg-card p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold">
                    {i + 1}. {area.id} — {area.label}
                  </h3>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      BAND_TEXT[area.band],
                    )}
                  >
                    {area.accuracy}%
                  </span>
                </div>
                <p className="measure mt-2 text-sm leading-relaxed text-muted-foreground">
                  {area.recommendation}
                </p>
                <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground">
                  {area.correct} of {area.answered} correct
                </p>
              </div>
            ))}
          </div>
          <Button asChild size="lg" className="mt-3 w-full sm:w-auto">
            <Link href="/study/session?focus=subdomain&count=15">
              Study my weak areas
            </Link>
          </Button>
        </section>
      ) : null}

      {/* Domains, each expandable to its sub-domains */}
      <section>
        <h2 className="mb-3 font-mono text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Domain breakdown
        </h2>
        <div className="rule-y border border-border">
          {domains.map((domain) => {
            const children = subdomains.filter(
              (s) => domainOf(s.id) === domain.roman,
            );
            const isOpen = open === domain.roman;

            return (
              <div key={domain.roman} className="bg-card">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : domain.roman)}
                  aria-expanded={isOpen}
                  className="w-full p-5 text-left transition-colors hover:bg-secondary"
                >
                  <Meter
                    slice={{
                      ...domain,
                      label: `Domain ${domain.roman} — ${domain.label}`,
                    }}
                  />
                  <span className="mt-2 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {/* A drawn caret. It rotates to show state, but the word
                        beside it already says "Show"/"Hide", so the rotation is
                        reinforcement rather than the signal. */}
                    <svg
                      viewBox="0 0 12 12"
                      className={cn(
                        "h-2.5 w-2.5 transition-transform duration-[120ms]",
                        isOpen && "rotate-180",
                      )}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M2.5 4.5 6 8l3.5-3.5" />
                    </svg>
                    {isOpen ? "Hide" : "Show"} {children.length} sub-domains
                  </span>
                </button>

                {isOpen ? (
                  <div className="space-y-4 border-t border-border bg-secondary p-5">
                    {children.map((child) => (
                      <Meter
                        key={child.id}
                        slice={{
                          ...child,
                          label: `${child.id} — ${child.label}`,
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
