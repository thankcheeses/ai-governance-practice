import Link from "next/link";
import { HowToOperateButton } from "@/components/landing/first-visit-tour";
import { BRAND } from "@/lib/brand";
import { withBasePath } from "@/lib/base-path";

export const metadata = {
  title: `How this works · ${BRAND.name}`,
};

export default function HelpPage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card/80">
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-5 py-4">
          <Link href="/" className="font-serif text-[1.125rem] no-underline">
            {BRAND.name}
          </Link>
          <HowToOperateButton />
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-5 py-10 sm:py-14">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent-foreground">
          Help
        </p>
        <h1 className="mt-2 font-serif text-[2rem] leading-tight sm:text-[2.25rem]">
          How to operate this app
        </h1>
        <p className="mt-3 text-[1rem] leading-relaxed text-muted-foreground">
          Scenario training for AI governance practitioners. Read a situation.
          Decide what you would do. Progress stays on this device unless you
          sign in to sync.
        </p>

        <section className="mt-10">
          <h2 className="font-serif text-[1.5rem]">Four passes</h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Work in this order. Naming a framework before the facts is the
            common failure.
          </p>
          <img
            src={withBasePath("/brand/agp-four-pass.svg")}
            alt="Facts, Obligations, Risks, Action"
            className="mt-5 w-full rounded-2xl border border-border"
            width={1200}
            height={560}
          />
          <ol className="mt-6 space-y-4 text-[0.9375rem] leading-relaxed">
            <li>
              <strong>Facts.</strong> What is actually described — the system,
              who it affects, what stage it is at. Separate this from what you
              assume.
            </li>
            <li>
              <strong>Obligations.</strong> What is required here, and by whom.
              Duties attach to roles and contexts.
            </li>
            <li>
              <strong>Risks.</strong> What could go wrong for the people on the
              receiving end, ranked by how badly rather than how likely.
            </li>
            <li>
              <strong>Action.</strong> The narrowest step that addresses that
              risk. A defensible answer names its trade-off.
            </li>
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-[1.5rem]">The practice loop</h2>
          <ol className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed">
            <li>
              <strong>Scenario.</strong> Read the facts without jumping to a
              framework.
            </li>
            <li>
              <strong>Decide.</strong> Choose the narrowest defensible next
              step.
            </li>
            <li>
              <strong>Feedback.</strong> See why — including the near-miss
              distractors.
            </li>
            <li>
              <strong>Carry forward.</strong> The takeaway is the portable rule
              for the next item.
            </li>
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-[1.5rem]">Study and Exam</h2>
          <img
            src={withBasePath("/brand/agp-study-exam.svg")}
            alt="Study versus Exam"
            className="mt-5 w-full rounded-2xl border border-border"
            width={1200}
            height={480}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-serif text-[1.125rem]">Study</h3>
              <ul className="mt-3 space-y-1.5 text-[0.875rem] text-muted-foreground">
                <li>Immediate feedback after every answer</li>
                <li>Rationale and near-miss explanation</li>
                <li>Wrong items enter the review queue</li>
                <li>Self-paced</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-serif text-[1.125rem]">Exam</h3>
              <ul className="mt-3 space-y-1.5 text-[0.875rem] text-muted-foreground">
                <li>No feedback until you submit</li>
                <li>Timed sitting</li>
                <li>Final score only</li>
                <li>Does not write to the review queue</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-[1.5rem]">What is saved</h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Answers stay on this device. Signing in only adds syncing across
            devices. The sample question on the home page is not recorded.
          </p>
        </section>

        <p className="mt-12">
          <Link href="/">Back to the start</Link>
        </p>
      </main>
    </div>
  );
}
