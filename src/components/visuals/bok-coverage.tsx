import { cn } from "@/lib/utils";
import { SUBDOMAINS, type DomainRoman } from "@/content/bok";
import { DiagramFrame } from "./primitives";

const DOMAIN_ORDER: DomainRoman[] = ["I", "II", "III", "IV"];

const DOMAIN_META: Record<DomainRoman, { title: string; short: string }> = {
  I: {
    title: "Foundations",
    short: "What AI is, why it needs governance, and how an organisation sets expectations.",
  },
  II: {
    title: "Laws & frameworks",
    short: "How existing privacy law, sector rules, and AI-specific instruments apply.",
  },
  III: {
    title: "Development",
    short: "Governing design, data, testing, and release of the system itself.",
  },
  IV: {
    title: "Deployment & use",
    short: "Deciding to deploy, assessing fitness, and governing ongoing operation.",
  },
};

export function BokCoverageMap({ className }: { className?: string }) {
  return (
    <DiagramFrame
      title="Coverage across the AIGP Body of Knowledge"
      lede="Thirteen competencies in four domains. Scenarios are mapped so weak areas can be identified. Structural coverage only — not an endorsement or score predictor."
      className={className}
      wide
    >
      <div className="space-y-6">
        {DOMAIN_ORDER.map((domain, idx) => {
          const items = SUBDOMAINS.filter((s) => s.domain === domain);
          const meta = DOMAIN_META[domain];
          return (
            <div
              key={domain}
              className={cn(
                "grid gap-4 border-t border-border/70 pt-5 sm:grid-cols-[10rem_minmax(0,1fr)]",
                idx === 0 && "border-t-0 pt-0",
              )}
            >
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Domain {domain}
                </p>
                <p className="mt-1 font-serif text-[1.0625rem] leading-snug text-foreground">
                  {meta.title}
                </p>
              </div>
              <div>
                <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {meta.short}
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-2 text-[0.8125rem] leading-snug text-foreground/90"
                    >
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {item.id}
                      </span>
                      <span>{item.competency}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-[0.6875rem] leading-relaxed text-muted-foreground">
        Source outline: IAPP AIGP Body of Knowledge (publicly published structure).
        This product is independent and unaffiliated.
      </p>
    </DiagramFrame>
  );
}
