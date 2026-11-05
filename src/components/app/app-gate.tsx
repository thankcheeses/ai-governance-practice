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
    /*
      A <main>, not a <div>.

      This branch is what every in-app route prerenders to: `ready` is false
      until progress has hydrated in the browser, so the HTML in the export —
      the document a screen reader, a crawler or a Lighthouse run actually
      receives — was this loading state, and it carried no landmark at all.
      `AppShell` has always had a <main>, but it only exists after hydration,
      which is too late for anyone navigating by landmark on a slow connection.

      It cannot double up: this returns instead of `AppShell`, never alongside
      it, so exactly one <main> is present in either state.
    */
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <span className="sr-only">Loading</span>
        <span className="skeleton h-2 w-40" role="status" aria-label="Loading" />
      </main>
    );
  }

  return <AppShell>{children}</AppShell>;
}
