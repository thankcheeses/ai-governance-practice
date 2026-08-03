"use client";

import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { BrandMark } from "@/components/app/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS, type Plan } from "@/lib/entitlements";
import { useProgress } from "@/lib/store/progress-provider";
import { cn } from "@/lib/utils";

export default function UpgradePage() {
  return (
    <AppGate>
      <Upgrade />
    </AppGate>
  );
}

function Upgrade() {
  const { progress, setTier } = useProgress();
  const isPro = progress.tier === "pro";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/study">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      {/* Brand moment — the 3D glass mark, used here and nowhere incidental. */}
      <section className="relative overflow-hidden rounded-lg brand-glass p-6 shadow-[var(--shadow-raised)] sm:p-8">
        <span
          className="brand-glass-sheen pointer-events-none absolute inset-0"
          aria-hidden
        />
        <div className="relative">
          <BrandMark variant="glass" className="h-14 w-14 rounded-2xl" />
          <h1 className="mt-5 text-pretty text-2xl font-semibold tracking-tight text-white">
            Go deeper than recall
          </h1>
          <p className="mt-2.5 max-w-md text-pretty text-sm leading-relaxed text-white/75">
            The value is not more questions. It is the mental models and applied
            simulations that let you reason through a governance decision you
            have not seen before.
          </p>
        </div>
      </section>

      <div className="space-y-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            active={
              (plan.id === "pro" && isPro) || (plan.id === "free" && !isPro)
            }
          />
        ))}
      </div>

      {/*
        No checkout in this build. Pricing and payment land in a later release;
        this control exists so the gated experience can be exercised end to end.
      */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold">Pricing is not live yet</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Payments are not part of this release. While Pro is in preview you
            can switch plans here to try the full experience.
          </p>

          {isPro ? (
            <Button
              variant="outline"
              className="mt-4 w-full sm:w-auto"
              onClick={() => setTier("free")}
            >
              Switch back to Free
            </Button>
          ) : (
            <Button
              className="mt-4 w-full sm:w-auto"
              onClick={() => setTier("pro")}
            >
              Enable Pro preview
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlanCard({ plan, active }: { plan: Plan; active: boolean }) {
  const planned = plan.status === "planned";

  return (
    <Card className={cn(active && "border-accent/50 ring-1 ring-accent/20")}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold">{plan.name}</h2>
            {active ? <Badge>Current plan</Badge> : null}
            {planned ? <Badge variant="secondary">Coming later</Badge> : null}
          </div>
          <span
            className={cn(
              "text-lg font-semibold tabular-nums",
              planned && "text-muted-foreground",
            )}
          >
            {plan.price}
          </span>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {plan.premise}
        </p>

        <ul className="mt-4 space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  planned ? "text-muted-foreground" : "text-accent",
                )}
                strokeWidth={2.5}
              />
              <span className={cn(planned && "text-muted-foreground")}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
