"use client";

import { ArrowLeft, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppGate } from "@/components/app/app-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTrack } from "@/content/registry";
import { FREE_QUESTION_LIMIT, PRO_FEATURES } from "@/lib/entitlements";
import { useProgress } from "@/lib/store/progress-provider";

export default function UpgradePage() {
  return (
    <AppGate>
      <Upgrade />
    </AppGate>
  );
}

function Upgrade() {
  const { progress, setTier } = useProgress();
  const track = getTrack(progress.trackId);
  const isPro = progress.tier === "pro";

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href="/study">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Judgment Labs Pro
          </h1>
          {isPro ? <Badge variant="success">Active</Badge> : null}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Full access to the {track.name} track and every study feature.
        </p>
      </div>

      <Card className="border-primary/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            <div>
              <h2 className="font-semibold">What Pro unlocks</h2>
              <p className="text-xs text-muted-foreground">
                Free covers the first {FREE_QUESTION_LIMIT} questions with mixed
                practice
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-4">
            {PRO_FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <div>
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/*
        No checkout in this build. Pricing and payment land in a later release;
        this control exists so the gated experience can be exercised end to end.
      */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold">Pricing coming soon</h2>
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
