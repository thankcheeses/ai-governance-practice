import Link from "next/link";
import { ContinueLink } from "@/components/landing/continue-link";
import {
  FirstVisitTour,
  HowToOperateButton,
} from "@/components/landing/first-visit-tour";
import { SampleDemo } from "@/components/landing/sample-demo";
import { sampleQuestion } from "@/components/landing/sample-question";
import { getTrackQuestions } from "@/content/registry";
import { BRAND } from "@/lib/brand";
import { withBasePath } from "@/lib/base-path";

export default function RootPage() {
  const available = getTrackQuestions().length;
  const sample = sampleQuestion();

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
        <div className="measure">
          <h1 className="text-[2.125rem] leading-[1.15] sm:text-[2.75rem]">
            {BRAND.tagline}
          </h1>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted-foreground">
            {available} original scenarios that put you in a governance decision
            and ask what you would do. Progress is saved on your device.
          </p>
          <div className="mt-7">
            <ContinueLink />
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
              Independent educational product. Not affiliated with the IAPP.
            </p>
          </div>
        </div>

        {sample ? (
          <section className="mt-16">
            <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Try one now
            </p>
            <h2 className="font-serif text-[1.5rem] leading-snug">
              A question from the bank
            </h2>
            <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
              Pick one. This does not save. It will not appear in your progress
              or review queue.
            </p>
            <div className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
              <SampleDemo />
            </div>
          </section>
        ) : null}

        <section className="mt-20">
          <h2 className="font-serif text-[1.5rem] leading-snug">
            How to read a scenario
          </h2>
          <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Four passes, in this order. The same method is on every study item
            under “How to read this.”
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

        <section className="mt-16 rounded-2xl border border-border bg-card px-6 py-8 sm:px-8">
          <h2 className="font-serif text-[1.375rem]">Same bank. Different pressure.</h2>
          <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            Study teaches the loop. Exam tests whether it holds. Coverage and
            the NIST cycle live in Help so this page stays a start, not a
            syllabus.
          </p>
          <p className="mt-4">
            <Link href="/help">Open Help</Link>
          </p>
        </section>

        <section className="mt-16 rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-[var(--shadow-card)] sm:px-10">
          <h2 className="font-serif text-[1.5rem]">Start with a scenario</h2>
          <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-muted-foreground">
            No account required.
          </p>
          <div className="mt-6 flex justify-center">
            <ContinueLink />
          </div>
        </section>

        <footer className="mt-16 border-t border-border pt-7">
          <p className="measure text-[0.875rem] leading-relaxed text-muted-foreground">
            Independent educational product. Not affiliated with, endorsed by,
            or approved by any certification body.
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
