"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrandMark } from "@/components/app/brand-mark";
import { BRAND } from "@/lib/brand";
import { useProgress } from "@/lib/store/progress-provider";

/**
 * Entry point. First-time visitors go to onboarding; returning learners go
 * straight to Home. Routing waits for hydration so a returning user never
 * flashes the onboarding screen.
 */
export default function RootPage() {
  const router = useRouter();
  const { progress, ready } = useProgress();

  useEffect(() => {
    if (!ready) return;
    router.replace(progress.onboardingCompletedAt ? "/home" : "/onboarding");
  }, [ready, progress.onboardingCompletedAt, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <BrandMark variant="3d" />
      <div>
        <p className="text-lg font-semibold tracking-tight">{BRAND.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{BRAND.tagline}</p>
      </div>
    </div>
  );
}
