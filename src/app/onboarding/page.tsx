"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Layers, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/app/app-shell";
import { Disclaimer } from "@/components/app/disclaimer";
import { Button } from "@/components/ui/button";
import { getTrack } from "@/content/registry";
import {
  BRAND,
  ONBOARDING_POINTS,
  ONBOARDING_WELCOME,
} from "@/lib/brand";
import { useProgress } from "@/lib/store/progress-provider";
import { cn } from "@/lib/utils";

const ICONS = [BookOpen, Layers, Target];

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
      <header className="mb-8 flex items-center gap-2.5">
        <Logo />
        <span className="text-[0.9375rem] font-semibold tracking-tight">
          {BRAND.name}
        </span>
      </header>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <Step key="welcome">
              <h1 className="text-pretty text-3xl font-semibold leading-tight tracking-tight">
                <span className="text-gradient">{ONBOARDING_WELCOME}</span>
              </h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {BRAND.positioning}
              </p>
              <div className="mt-8 rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your track
                </p>
                <p className="mt-2 font-semibold">{track.name}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {track.summary}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {track.questionCount} questions across {track.domains.length}{" "}
                  domains.
                </p>
              </div>
            </Step>
          ) : step === 1 ? (
            <Step key="what">
              <h1 className="text-2xl font-semibold tracking-tight">
                How this works
              </h1>
              <ul className="mt-6 space-y-4">
                {ONBOARDING_POINTS.map((point, i) => {
                  const Icon = ICONS[i];
                  return (
                    <li
                      key={point.title}
                      className="flex gap-3.5 rounded-xl border border-border bg-card p-4"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </span>
                      <div>
                        <h2 className="font-semibold">{point.title}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {point.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Step>
          ) : (
            <Step key="disclaimer">
              <h1 className="text-2xl font-semibold tracking-tight">
                Before you start
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Please read this. It is also available any time in Settings.
              </p>
              <Disclaimer className="mt-5" />
            </Step>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-8">
        <div className="mb-5 flex justify-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "w-6 bg-primary" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>

        {step < 2 ? (
          <Button size="lg" className="w-full" onClick={() => setStep((s) => s + 1)}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={finish}>
            I understand — start studying
          </Button>
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

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
