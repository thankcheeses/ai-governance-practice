import { cn } from "@/lib/utils";
import { SUBDOMAINS, type DomainRoman } from "@/content/bok";
import { DiagramShell, RAISED } from "./primitives";

/**
 * Compact coverage map of the 13 AIGP BoK competencies.
 *
 * Purpose: show that the bank is structured against the published outline,
 * not a random collection of scenarios. No claim of endorsement or exam
 * prediction — only structural coverage.
 */

const DOMAIN_ORDER: DomainRoman[] = ["I", "II", "III", "IV"];

const DOMAIN_SHORT: Record<DomainRoman, string> = {
  I: "Foundations",
  II: "Laws & frameworks",
  III: "Development",
  IV: "Deployment & use",
};

export function BokCoverageMap({ className }: { className?: string }) {
  return (
    <DiagramShell
      title="Coverage across the AIGP Body of Knowledge"
      description="Thirteen competencies across four domains. Scenarios are mapped to these competencies so weak areas can be identified. Structural coverage only — not an endorsement or score predictor."
      className={className}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {DOMAIN_ORDER.map((domain) => {
          const items = SUBDOMAINS.filter((s) => s.domain === domain);
          return (
            <div
              key={domain}
              className={cn(
                "rounded-lg border border-border bg-background/70 p-3.5",
                RAISED,
              )}
            >
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Domain {domain}
              </p>
              <p className="mt-0.5 text-[0.8125rem] font-medium text-foreground">
                {DOMAIN_SHORT[domain]}
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-2 text-[0.75rem] leading-snug text-foreground/90"
                  >
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {item.id}
                    </span>
                    <span>{item.competency}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
        Source outline: IAPP AIGP Body of Knowledge (publicly published structure).
        This product is independent and unaffiliated.
      </p>
    </DiagramShell>
  );
}
