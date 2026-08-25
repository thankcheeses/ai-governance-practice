import Link from "next/link";
import { ScenarioDecisionFrame } from "@/components/civic/gpai";
import { SectionHeading } from "@/components/civic/surfaces";
import { ContinueLink } from "@/components/landing/continue-link";
import { SampleDemo } from "@/components/landing/sample-demo";
import { getTrackQuestions } from "@/content/registry";
import { BRAND } from "@/lib/brand";

/**
 * The public entry.
 *
 * This route used to redirect: first-time visitors went to onboarding,
 * returning ones to Home, and nobody saw the product before committing to it.
 * It now leads with one real question, because the thing worth showing is the
 * decision itself — not a description of it, and not an illustration.
 *
 * It is deliberately outside `AppGate` and `AppShell`, which are applied per
 * page rather than in a layout. `/terms` and `/privacy` set that precedent.
 *
 * Nothing on this page writes. `SampleDemo` never holds the progress handle at
 * all, and `ContinueLink` reads it without calling a mutator — so a visitor
 * can work the sample, get it wrong, and leave, with no attempt recorded, no
 * review card enqueued, no onboarding flag set, and no request to Supabase.
 */
export default function RootPage() {
  const available = getTrackQuestions().length;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1180px] items-center px-5 py-4 sm:px-6 lg:px-10">
          <span className="font-serif text-[1.125rem]">{BRAND.name}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-5 py-10 sm:px-6 lg:px-10 lg:py-16">
        <div className="measure">
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

        {/* ------------------------------------------------ The sample --- */}
        <section className="mt-14">
          <SectionHeading
            level={2}
            eyebrow="Try one now"
            title="A question from the bank"
            lede="This is a real item, not a simplified demonstration. Nothing you do here is recorded — it will not appear in your progress, your review queue, or anywhere else."
            className="mb-7"
          />
          <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
            <SampleDemo />
          </div>
        </section>

        {/* ------------------------------------------- The method used --- */}
        <section className="mt-12">
          <SectionHeading
            level={2}
            title="How to read a scenario"
            lede="The same four passes work on every question in the app, and on real decisions outside it."
            className="mb-5"
          />
          <ScenarioDecisionFrame variant="expanded" />
        </section>

        <footer className="mt-16 border-t border-border pt-7">
          <p className="measure text-[0.875rem] leading-relaxed text-muted-foreground">
            Independent educational product. Not affiliated with, endorsed by,
            or approved by any certification body. It does not contain
            certification exam questions and does not predict a result.
          </p>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.875rem]">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
