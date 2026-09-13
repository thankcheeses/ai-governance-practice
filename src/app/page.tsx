import Link from "next/link";
import { ScenarioDecisionFrame } from "@/components/civic/gpai";
import { ContinueLink } from "@/components/landing/continue-link";
import {
  FirstVisitTour,
  HowToOperateButton,
} from "@/components/landing/first-visit-tour";
import { SampleDemo } from "@/components/landing/sample-demo";
import {
  BokCoverageMap,
  LearningLoop,
  RmfLoop,
  StudyExamCompare,
} from "@/components/visuals";
import { getTrackQuestions } from "@/content/registry";
import { BRAND } from "@/lib/brand";
import { withBasePath } from "@/lib/base-path";

export default function RootPage() {
  const available = getTrackQuestions().length;

  return (
    <div className="min-h-dvh">
      <FirstVisitTour />
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-5 py-4 sm:px-6 lg:px-10">
          <img
            src={withBasePath("/brand/agp-mark.svg")}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          <span className="font-serif text-[1.125rem]">{BRAND.name}</span>
          <nav className="ml-auto flex items-center gap-4 text-[0.875rem]">
            <HowToOperateButton />
            <Link href="/help">Help</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-5 py-10 sm:px-6 lg:px-10 lg:py-16">
        <figure className="-mx-1 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
          <img
            src={withBasePath("/brand/agp-hero-banner.svg")}
            alt="AI Governance Practice. Scenario training for practitioners. Judgment, not vocabulary. 296 original scenarios. Four passes: Facts, Obligations, Risks, Action."
            className="block h-auto w-full"
            width={1600}
            height={840}
          />
        </figure>

        <div className="measure mt-10">
          <h1 className="text-[2.125rem] leading-[1.15] sm:text-[2.75rem]">
            {BRAND.tagline}
          </h1>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted-foreground">
            {available} original scenarios that put you in a governance decision
            and ask what you would do. Progress is saved on your device and
            works without an account — signing in only adds syncing across
            devices.
          </p>
          <div className="mt-7">
            <ContinueLink />
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
              Independent educational product. Not affiliated with the IAPP.
            </p>
          </div>
        </div>

        <section className="mt-16">
          <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Try one now
          </p>
          <h2 className="font-serif text-[1.5rem] leading-snug tracking-[-0.01em] text-foreground sm:text-[1.75rem]">
            A question from the bank
          </h2>
          <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
            This is a real item, not a simplified demonstration. Nothing you do
            here is recorded — it will not appear in your progress, your review
            queue, or anywhere else.
          </p>
          <div className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            <SampleDemo />
          </div>
        </section>

        <section className="mt-20">
          <h2 className="font-serif text-[1.5rem] leading-snug tracking-[-0.01em] text-foreground sm:text-[1.75rem]">
            How to read a scenario
          </h2>
          <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
            The same four passes work on every question in the app, and on real
            decisions outside it.
          </p>
          <figure className="mt-7 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
            <img
              src={withBasePath("/brand/agp-four-pass.svg")}
              alt="Four passes: Facts, Obligations, Risks, then Action. Work in this order. Naming a framework before the facts is the common failure."
              className="block h-auto w-full"
              width={1200}
              height={560}
            />
          </figure>
          <div className="mt-8">
            <ScenarioDecisionFrame variant="expanded" />
          </div>
        </section>

        <section className="mt-24">
          <div className="measure">
            <h2 className="font-serif text-[1.75rem] leading-snug tracking-[-0.015em] text-foreground sm:text-[2rem]">
              Practice judgment, not vocabulary
            </h2>
            <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted-foreground">
              Knowing the terms is the starting point. Knowing what to notice,
              who is responsible, what could go wrong, and what to do next is
              the work. Every scenario in this product is built to train that
              loop.
            </p>
          </div>
          <div className="mt-10 max-w-xl">
            <LearningLoop />
          </div>
        </section>

        <section className="mt-24">
          <div className="measure mb-8">
            <h2 className="font-serif text-[1.5rem] leading-snug tracking-[-0.01em] text-foreground sm:text-[1.75rem]">
              A framework you can operate
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
              The NIST AI Risk Management Framework is one of the instruments
              the scenarios reference. Govern frames the work; Map, Measure, and
              Manage keep it moving.
            </p>
          </div>
          <RmfLoop />
        </section>

        <section className="mt-24">
          <div className="measure mb-8">
            <h2 className="font-serif text-[1.5rem] leading-snug tracking-[-0.01em] text-foreground sm:text-[1.75rem]">
              Same bank. Different pressure.
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
              Study mode teaches the reasoning. Exam mode tests whether it holds
              when feedback is withheld and the clock is running.
            </p>
          </div>
          <figure className="mb-8 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
            <img
              src={withBasePath("/brand/agp-study-exam.svg")}
              alt="Study teaches the loop with immediate feedback. Exam tests whether it holds when feedback is withheld."
              className="block h-auto w-full"
              width={1200}
              height={480}
            />
          </figure>
          <StudyExamCompare />
        </section>

        <section className="mt-24">
          <div className="measure mb-8">
            <h2 className="font-serif text-[1.5rem] leading-snug tracking-[-0.01em] text-foreground sm:text-[1.75rem]">
              Structured against the published outline
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
              Scenarios map to the thirteen competencies across four domains so
              weak areas can be identified. Structural coverage only — not an
              endorsement or a prediction of any exam result.
            </p>
          </div>
          <BokCoverageMap />
        </section>

        <section className="mt-24 rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-[var(--shadow-card)] sm:px-10">
          <h2 className="font-serif text-[1.5rem] leading-snug tracking-[-0.01em] text-foreground sm:text-[1.75rem]">
            Start with a scenario
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
            No account required. Progress stays on this device until you choose
            to sync.
          </p>
          <div className="mt-6 flex justify-center">
            <ContinueLink />
          </div>
        </section>

        <footer className="mt-16 border-t border-border pt-7">
          <p className="measure text-[0.875rem] leading-relaxed text-muted-foreground">
            Independent educational product. Not affiliated with, endorsed by,
            or approved by any certification body. It does not contain
            certification exam questions and does not predict a result.
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
