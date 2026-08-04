"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/app/app-shell";
import { useProgress } from "@/lib/store/progress-provider";

/**
 * Wraps every in-app route. Holds first paint until progress has hydrated —
 * without this the Home screen renders zeros and then snaps to real numbers —
 * and redirects anyone who has not been through onboarding.
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { progress, ready } = useProgress();

  useEffect(() => {
    if (ready && !progress.onboardingCompletedAt) router.replace("/onboarding");
  }, [ready, progress.onboardingCompletedAt, router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="sr-only">Loading</span>
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
