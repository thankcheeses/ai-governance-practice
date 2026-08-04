"use client";

import { ArrowLeft, Check, Clock } from "lucide-react";
import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { BrandMark } from "@/components/app/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LABS } from "@/content/labs";
import { COMPANY } from "@/lib/brand";
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
  const currentTier = progress.tier;

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
            Better judgment, not more questions
          </h1>
          <p className="mt-2.5 max-w-md text-pretty text-sm leading-relaxed text-white/75">
            The upgrade is the review system and the analysis that tell you
            where your reasoning is weak — so you can work a governance decision
            you have not seen before.
          </p>
        </div>
      </section>

      <div className="space-y-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={plan.tier !== undefined && plan.tier === currentTier}
          />
        ))}
      </div>

      {/* Named so the roadmap is concrete, without creating routes or pages. */}
      <section>
        <h2 className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Labs in development
        </h2>
        <Card>
          <CardContent className="p-5">
            <ul className="space-y-3.5">
              {LABS.map((lab) => (
                <li key={lab.id}>
                  <h3 className="text-sm font-medium">{lab.name}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {lab.premise}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/*
        No checkout in this build. Payments land in a later release; this
        control exists so the gated experience can be exercised end to end.
      */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold">Billing is not live yet</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            No plan can be purchased yet and no payment details are collected.
            Prices shown are what each plan will cost at launch. You can switch
            plans here to try the Professional experience during the beta.
          </p>

          {currentTier === "free" ? (
            <Button
              className="mt-4 w-full sm:w-auto"
              onClick={() => setTier("pro")}
            >
              Enable Professional preview
            </Button>
          ) : (
            <Button
              variant="outline"
              className="mt-4 w-full sm:w-auto"
              onClick={() => setTier("free")}
            >
              Switch back to Free
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlanCard({ plan, current }: { plan: Plan; current: boolean }) {
  const planned = plan.status === "planned";

  return (
    <Card className={cn(current && "border-accent/50 ring-1 ring-accent/20")}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{plan.name}</h2>
            {current ? <Badge>Current plan</Badge> : null}
            {planned ? <Badge variant="secondary">Coming soon</Badge> : null}
          </div>
          <div className="text-right">
            <div
              className={cn(
                "text-lg font-semibold tabular-nums",
                planned && "text-muted-foreground",
              )}
            >
              {plan.price}
            </div>
            {plan.priceNote ? (
              <div className="text-xs text-muted-foreground">
                {plan.priceNote}
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {plan.premise}
        </p>

        {plan.features.length > 0 ? (
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
        ) : null}

        {/*
          Deliberately not ticked. These are named so the plan is concrete, and
          marked unbuilt so the card cannot be read as a list of what you get.
        */}
        {plan.comingSoon?.length ? (
          <div className="mt-4">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Coming soon
            </p>
            <ul className="mt-2 space-y-2">
              {plan.comingSoon.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {plan.contactSales ? (
          <a
            href={`mailto:${COMPANY.email}?subject=${encodeURIComponent("Enterprise enquiry")}`}
            className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {COMPANY.email}
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
