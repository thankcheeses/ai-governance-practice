"use client";

import {
  MonitoringThatActuallyWorks,
  OversightLevelComparison,
  ScenarioDecisionFrame,
  WhoIsAccountable,
} from "@/components/civic/gpai";

/** Public copy of the practice-home toolkit. No account, no onboarding. */
export function PublicToolkit() {
  return (
    <section id="toolkit" className="mt-20 scroll-mt-24">
      <h2 className="font-serif text-[1.75rem] leading-snug">Governance toolkit</h2>
      <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
        The same four cards on the practice home. No account, and no onboarding, to read them.
      </p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <OversightLevelComparison />
        <WhoIsAccountable />
        <MonitoringThatActuallyWorks />
        <ScenarioDecisionFrame />
      </div>
    </section>
  );
}
