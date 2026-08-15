"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Disclaimer } from "@/components/app/disclaimer";
import {
  DimensionalMark,
  type MarkName,
} from "@/components/civic/dimensional-mark";
import { ScenarioDecisionFrame } from "@/components/civic/gpai";
import { Button } from "@/components/ui/button";
import { getTrack } from "@/content/registry";
import {
  BRAND,
  ONBOARDING_POINTS,
  ONBOARDING_WELCOME,
} from "@/lib/brand";
import { useProgress } from "@/lib/store/progress-provider";
import { cn } from "@/lib/utils";

/*
  One dimensional mark per orientation point, in the order `ONBOARDING_POINTS`
  declares them. Each sits beside its own heading and body copy, so the mark is
  reinforcement rather than the carrier of any meaning.
*/
const POINT_MARKS: MarkName[] = ["study", "decision", "progress"];

/**
 * First-launch onboarding: welcome, what the product is, then the disclaimer
 * which must be acknowledged before entering the app.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding } = useProgress();
  const [step, setStep] = useState(0);
  const track = getTrack();

  function finish() {
    completeOnboarding();
    router.replace("/home");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-8 sm:py-12">
      <header className="mb-9">
        <span className="font-serif text-[1.125rem]">{BRAND.name}</span>
      </header>

      <div className="flex-1">
          {step === 0 ? (
            <Step key="welcome">
              <h1 className="text-pretty text-[2rem] leading-tight sm:text-[2.25rem]">
                {ONBOARDING_WELCOME}
              </h1>
              <p className="measure mt-4 text-[1rem] leading-relaxed text-muted-foreground">
                {BRAND.category} {BRAND.lines.apply}
              </p>
              <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-card">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Your track
                </p>
                <h2 className="mt-2 font-sans text-[1.0625rem] font-semibold">
                  {track.name}
                </h2>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {track.summary}
                </p>
                <p className="mt-3 text-[0.875rem] text-muted-foreground">
                  {track.questionCount} scenarios across {track.domains.length}{" "}
                  domains.
                </p>
              </div>
            </Step>
          ) : step === 1 ? (
            <Step key="what">
              <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">
                How this works
              </h1>
              <ul className="mt-6 space-y-3.5">
                {ONBOARDING_POINTS.map((point, i) => (
                  <li
                    key={point.title}
                    className="flex gap-3.5 rounded-xl border border-border bg-card p-5 shadow-card"
                  >
                    <DimensionalMark name={POINT_MARKS[i] ?? "study"} size="md" />
                    <div className="min-w-0">
                      <h2 className="font-sans text-[1rem] font-semibold">
                        {point.title}
                      </h2>
                      <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted-foreground">
                        {point.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/*
                The decision frame belongs here because it is the method the
                whole product teaches. Compact, so orientation stays three short
                steps rather than becoming a lesson.
              */}
              <ScenarioDecisionFrame className="mt-5" />
            </Step>
          ) : (
            <Step key="disclaimer">
              <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">
                Before you start
              </h1>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                Please read this. It is also available any time in Settings.
              </p>
              <Disclaimer className="mt-5" />
            </Step>
          )}
      </div>

      <footer className="mt-8">
        {/*
          A compact dimensional progress path. `aria-hidden` because the step is
          already announced in words directly beneath it — a screen reader
          should hear "Step 2 of 3", not three unlabelled shapes.
        */}
        <div className="mb-3 flex items-center justify-center gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2.5 rounded-full border transition-all duration-[120ms]",
                  i === step
                    ? "w-7 border-transparent bg-accent shadow-raised"
                    : i < step
                      ? "w-2.5 border-transparent bg-accent"
                      : "w-2.5 border-border bg-secondary",
                )}
              />
              {i < 2 ? (
                <span className="h-[2px] w-4 rounded-full bg-border-strong/40" />
              ) : null}
            </div>
          ))}
        </div>
        <p className="mb-5 text-center text-[0.75rem] text-muted-foreground">
          Step {step + 1} of 3
        </p>

        {step < 2 ? (
          <Button size="lg" className="w-full" onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <>
            <Button size="lg" className="w-full" onClick={finish}>
              I understand — start studying
            </Button>
            {/*
              Acceptance is recorded at this tap, so the documents being agreed
              to have to be reachable from here rather than only from Settings.
            */}
            <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
              By continuing you agree to our{" "}
              <Link
                href="/terms"
                className="font-medium text-link underline decoration-link/40 underline-offset-4 transition-colors hover:text-link-hover hover:decoration-link-hover"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium text-link underline decoration-link/40 underline-offset-4 transition-colors hover:text-link-hover hover:decoration-link-hover"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </>
        )}

        {step > 0 ? (
          <Button
            variant="ghost"
            className="mt-2 w-full"
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
        ) : null}
      </footer>
    </div>
  );
}

/**
 * Steps swap without transition. Advancing is a state change the learner
 * initiated, so it is shown, not performed.
 */
function Step({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
