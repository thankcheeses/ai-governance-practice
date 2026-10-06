import Link from "next/link";
import { ContinueLink } from "@/components/landing/continue-link";
import {
  FirstVisitTour,
  HowToOperateButton,
} from "@/components/landing/first-visit-tour";
import { SampleDemo } from "@/components/landing/sample-demo";
import { sampleQuestion } from "@/components/landing/sample-question";
import { getTrackQuestions } from "@/content/registry";
import { SUBDOMAINS } from "@/content/bok";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { withBasePath } from "@/lib/base-path";

/**
 * The landing page.
 *
 * ## What was wrong with the old one
 *
 * It said "296 original questions" and stopped. Everything that took real work
 * — a written rationale on every item, an explanation for every wrong option
 * anyone could pick, spaced repetition, confidence calibration — was invisible,
 * so the page undersold a product that is considerably better than the page.
 * The fix is not louder adjectives; it is showing the machinery.
 *
 * ## Every number here is derived, never typed
 *
 * The counts below are computed from the bank at build time. A landing page
 * that claims a number the content does not contain is the first thing a
 * careful reader checks, and this one cannot drift: if an item loses its
 * rationale, the number on this page drops by itself.
 *
 * ## What stays
 *
 * The non-affiliation line stays, in substance and in position near the call to
 * action. `BRAND` records that positioning is locked — copy must never promise
 * exam outcomes, claim official status, or imply endorsement — and a page
 * selling AI governance judgment cannot be the place those rules get relaxed.
 * Confident and accurate are not in tension; hedging and accurate are different
 * things, and it was the hedging that read as amateur.
 */
export default function RootPage() {
  const questions = getTrackQuestions();
  const available = questions.length;
  const domains = new Set(questions.map((q) => q.domain)).size;
  const subdomains = Object.keys(SUBDOMAINS).length;
  const scenarioQuestions = questions.filter((q) => q.scenario);
  const factPatterns = new Set(scenarioQuestions.map((q) => q.scenario!.id)).size;
  const optionNotes = questions.reduce(
    (n, q) => n + Object.keys(q.distractorNotes ?? {}).length,
    0,
  );
  const sample = sampleQuestion();

  return (
    <div className="min-h-dvh">
      <FirstVisitTour />
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-5 py-4 sm:px-6 lg:px-10">
          <img
            src={withBasePath("/brand/agp-mark.svg")}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          {/*
            Both the wordmark and the nav wrapped to two lines at 390px, which
            made the first thing anyone sees look cramped. Neither needs to
            wrap: the bar has room once they are allowed to stay on one line.
          */}
          <span className="truncate whitespace-nowrap font-serif text-[1.0625rem] sm:text-[1.125rem]">
            {BRAND.name}
          </span>
          <nav className="ml-auto flex shrink-0 items-center gap-4 whitespace-nowrap text-[0.875rem]">
            <HowToOperateButton />
            <Link href="/help">Help</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-12 sm:px-6 lg:px-10 lg:pt-20">
        {/* ----------------------------------------------------------- hero */}
        <section className="measure">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-strong">
            {BRAND.tagline}
          </p>
          <h1 className="mt-3 text-[2.25rem] leading-[1.08] sm:text-[3.25rem]">
            Practice the decision,{" "}
            <br className="hidden sm:inline" />
            not the definition.
          </h1>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted-foreground">
            {available} original questions, including {scenarioQuestions.length} questions across {factPatterns} multi-question fact patterns, put you inside a governance decision and ask what you would do. Then every option is explained — including
            the {optionNotes.toLocaleString()} wrong ones, and why each was
            tempting.
          </p>
        </section>

        {/* --------------------------------------------------- three ways in */}
        <section className="mt-10" aria-labelledby="start">
          <h2 id="start" className="sr-only">
            Ways to start
          </h2>
          {/*
            Three doors, stated plainly, because the difference between them is
            where your work lives — and that is a decision someone is entitled
            to make before they type anything, not after.
          */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-accent/30 bg-gradient-to-br from-accent-tint/50 via-card to-card p-5 shadow-[var(--shadow-card)]">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-strong">
                Recommended
              </p>
              <h3 className="mt-1.5 font-serif text-[1.125rem]">
                Start on this device
              </h3>
              <p className="mt-1.5 flex-1 text-[0.875rem] leading-relaxed text-muted-foreground">
                No account, no email. Progress is stored in this browser and
                stays there.
              </p>
              {/*
                The shared CTA label is sized for a standalone hero and
                overflowed this card on both breakpoints. Constrained here so
                the button belongs to the card, rather than shortening a label
                the closing section still wants in full.
              */}
              <div className="mt-4 [&_a]:w-full [&_a]:whitespace-normal [&_a]:text-center [&>div]:w-full">
                <ContinueLink />
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Across devices
              </p>
              <h3 className="mt-1.5 font-serif text-[1.125rem]">
                Save with an email
              </h3>
              <p className="mt-1.5 flex-1 text-[0.875rem] leading-relaxed text-muted-foreground">
                An account syncs your answers, review schedule and streak between
                phone and laptop.
              </p>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/login">Create an account</Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Nothing saved
              </p>
              <h3 className="mt-1.5 font-serif text-[1.125rem]">Just look</h3>
              <p className="mt-1.5 flex-1 text-[0.875rem] leading-relaxed text-muted-foreground">
                Answer one below. It is not recorded and will not enter your
                review queue.
              </p>
              <div className="mt-4">
                <Button asChild variant="ghost">
                  <a href="#try">Try a scenario</a>
                </Button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
            Free, with no paid tier. Independent educational product, not
            affiliated with or endorsed by any certification body.
          </p>
        </section>

        {/* ------------------------------------------------------ the numbers */}
        <section className="mt-16 border-y border-border py-7">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
            {[
              [available.toLocaleString(), "original questions"],
              [`${domains}`, "governance domains"],
              [`${subdomains}`, "sub-domains covered"],
              [optionNotes.toLocaleString(), "wrong options explained"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-serif text-[2rem] leading-none tabular-nums">
                  {value}
                </dt>
                <dd className="mt-1.5 text-[0.8125rem] leading-snug text-muted-foreground">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------------------------------------------------- the machinery */}
        <section className="mt-16">
          <h2 className="font-serif text-[1.75rem] leading-snug">
            What it does that a question bank does not
          </h2>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {[
              {
                h: "Every wrong answer is explained",
                p: "Not just the correct one. Each option you could have picked has a written note on why it looked right and where it fails — because the near-miss is the one worth understanding.",
              },
              {
                h: "One tap, and the answer is final",
                p: "There is no submit button to hover over and no selection to nudge while you re-read the options. Choosing commits the answer, which is the condition you sit the exam under — and it stops practice rewarding the habit of narrowing to two and fishing.",
              },
              {
                h: "Missed items come back on a schedule",
                p: "A spaced-repetition queue decides when you see something again, so revision is driven by what you actually got wrong rather than by what you feel like revisiting.",
              },
              {
                h: "It separates rushing from not knowing",
                p: "Answers far faster than your own norm are flagged as a reading problem rather than a knowledge one. Telling someone to study harder when they are skimming is the wrong advice.",
              },
              {
                h: "Patterns across misses, not just per question",
                p: "When enough evidence accumulates, it names the kind of thinking that keeps failing — acting before establishing cause, naming the wrong accountable party — and only when the evidence supports it.",
              },
              {
                h: "Timed mode, same bank",
                p: "Practice teaches the loop. Exam mode tests whether it holds under a clock, with no feedback until the end.",
              },
            ].map((f) => (
              <div key={f.h}>
                <h3 className="text-[1rem] font-semibold leading-snug">{f.h}</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {f.p}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------- try */}
        {sample ? (
          <section id="try" className="mt-20 scroll-mt-24">
            <h2 className="font-serif text-[1.75rem] leading-snug">
              Try one now
            </h2>
            <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
              A real scenario from the bank. Nothing here is recorded, and it
              will not appear in your progress or review queue.
            </p>
            <div className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
              <SampleDemo />
            </div>
          </section>
        ) : null}

        {/* ------------------------------------------------------ four passes */}
        <section className="mt-20">
          <h2 className="font-serif text-[1.75rem] leading-snug">
            How to read a scenario
          </h2>
          <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Four passes, in this order. The same method sits on every study item
            under “How to read this”.
          </p>
          <figure className="mt-7 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
            <img
              src={withBasePath("/brand/agp-four-pass.svg")}
              alt="Facts, Obligations, Risks, then Action."
              className="block h-auto w-full"
              width={1200}
              height={560}
            />
          </figure>
        </section>

        {/* ------------------------------------------------------- final CTA */}
        <section className="mt-20 rounded-3xl border border-accent/25 bg-gradient-to-br from-accent-tint/50 via-card to-card px-6 py-12 text-center shadow-[var(--shadow-card)] sm:px-10">
          <h2 className="font-serif text-[1.75rem] leading-snug">
            Start with one scenario
          </h2>
          <p className="mx-auto mt-2.5 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
            Five minutes is enough to find out whether this is the kind of
            practice you have been missing.
          </p>
          <div className="mt-7 flex justify-center">
            <ContinueLink />
          </div>
        </section>

        <footer className="mt-16 border-t border-border pt-7">
          <p className="measure text-[0.875rem] leading-relaxed text-muted-foreground">
            Independent educational product. Not affiliated with, endorsed by,
            or approved by any certification body. Published by{" "}
            NHID-Clinical.
          </p>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.875rem]">
            <Link href="/help">Help</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
