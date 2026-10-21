"use client";

import {
  Briefcase,
  Building,
  Building2,
  Cpu,
  Database,
  Factory,
  FileText,
  Gavel,
  GraduationCap,
  House,
  Info,
  Landmark,
  type LucideIcon,
  Newspaper,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  TriangleAlert,
  Users,
  Zap,
} from "lucide-react";
import type { Scenario } from "@/content/types";
import { type LaneId, buildBoard } from "@/lib/scenario-board";
import { cn } from "@/lib/utils";

/**
 * The scenario as a case board: the brief's own facts laid out as the path a
 * reader should take through them — who is involved, what the system does,
 * which rules apply, what the warning signs are, and the call being asked for.
 *
 * Built only from `scenario.facts`, verbatim. See `lib/scenario-board.ts` for
 * how labels are sorted; this file is presentation.
 */

const LANE_STYLE: Record<LaneId, { icon: LucideIcon; bar: string; chip: string; ink: string }> = {
  people: { icon: Users, bar: "bg-primary", chip: "bg-primary/10", ink: "text-primary" },
  system: { icon: Database, bar: "bg-accent", chip: "bg-accent-tint", ink: "text-accent-strong" },
  rules: { icon: Scale, bar: "bg-insight", chip: "bg-insight-tint", ink: "text-insight-foreground" },
  signals: { icon: TriangleAlert, bar: "bg-destructive", chip: "bg-destructive-tint", ink: "text-destructive" },
  decision: { icon: Gavel, bar: "bg-success", chip: "bg-success-tint", ink: "text-success" },
  context: { icon: Info, bar: "bg-border-strong", chip: "bg-secondary", ink: "text-muted-foreground" },
};

function sectorIcon(sector: string): LucideIcon {
  const s = sector.toLowerCase();
  if (/financ|bank|lend/.test(s)) return Landmark;
  if (/employ|hiring|logistic/.test(s)) return Briefcase;
  if (/government|public/.test(s)) return Building2;
  if (/educat/.test(s)) return GraduationCap;
  if (/retail|commerce/.test(s)) return ShoppingCart;
  if (/energy|infrastructure/.test(s)) return Zap;
  if (/insur/.test(s)) return ShieldCheck;
  if (/tech/.test(s)) return Cpu;
  if (/manufactur/.test(s)) return Factory;
  if (/media/.test(s)) return Newspaper;
  if (/health|clinic/.test(s)) return Stethoscope;
  if (/hous/.test(s)) return House;
  if (/corporate/.test(s)) return Building;
  return FileText;
}

export function ScenarioBoard({
  scenario,
  className,
}: {
  scenario: Pick<Scenario, "title" | "sector" | "facts">;
  className?: string;
}) {
  const lanes = buildBoard(scenario);
  if (!lanes.length) return null;
  const SectorIcon = sectorIcon(scenario.sector);

  return (
    <figure
      aria-label="Case at a glance"
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-background/60 p-4 sm:p-5",
        className,
      )}
    >
      <figcaption className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_1px_0_rgb(0_0_0/0.15)]">
          <SectorIcon aria-hidden className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Case at a glance · {scenario.sector}
          </span>
          <span className="block text-[0.8125rem] text-muted-foreground">
            Read it in order: who, what, which rules, what looks wrong, then the call.
          </span>
        </span>
      </figcaption>

      <ol className="grid gap-2.5 sm:grid-cols-2">
        {lanes.map((lane, i) => {
          const style = LANE_STYLE[lane.id];
          const Icon = style.icon;
          const last = i === lanes.length - 1;
          return (
            <li
              key={lane.id}
              className={cn(
                "relative min-w-0 overflow-hidden rounded-lg border border-border bg-card pl-3 shadow-[var(--shadow-card)]",
                // The decision closes the board, full width, so it reads as
                // where the other lanes lead.
                last && "sm:col-span-2",
                lane.id === "decision" && "border-success/60",
                lane.id === "signals" && "border-destructive/40",
              )}
            >
              <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", style.bar)} />
              <div className="p-3">
                <p className={cn("flex items-center gap-2 text-[0.8125rem] font-semibold", style.ink)}>
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold text-white",
                      style.bar,
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", style.chip)}>
                    <Icon aria-hidden className="h-3.5 w-3.5" />
                  </span>
                  {lane.title}
                </p>
                <p className="mt-1 text-[0.75rem] leading-snug text-muted-foreground">
                  {lane.prompt}
                </p>
                <dl className={cn("mt-2.5 grid gap-2", last && lane.facts.length > 1 && "sm:grid-cols-2")}>
                  {lane.facts.map((f) => (
                    <div key={f.label} className={cn("rounded-md px-2.5 py-2", style.chip)}>
                      <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {f.label}
                      </dt>
                      <dd className="mt-0.5 text-[0.8125rem] leading-snug text-foreground">
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
