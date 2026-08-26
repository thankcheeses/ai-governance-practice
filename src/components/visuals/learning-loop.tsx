import { cn } from "@/lib/utils";
import { DiagramShell, FlowArrow, RAISED } from "./primitives";

const STEPS = [
  { name: "Scenario", detail: "Read the facts without jumping to a framework." },
  { name: "Decide", detail: "Choose the narrowest defensible next step." },
  { name: "Feedback", detail: "See why — including near-miss distractors." },
  { name: "Carry forward", detail: "Key takeaway becomes the portable rule." },
] as const;

export function LearningLoop({ className }: { className?: string }) {
  return (
    <DiagramShell
      title="How a scenario trains judgment"
      description="The product is built around one loop. Vocabulary is necessary; the loop is what turns it into practice."
      className={className}
    >
      <ol className="flex flex-wrap items-stretch justify-center gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s.name} className="flex items-center gap-1.5">
            {i > 0 ? <FlowArrow /> : null}
            <div
              className={cn(
                "max-w-[10rem] rounded-lg border border-border bg-background/70 px-3 py-2.5",
                RAISED,
              )}
            >
              <p className="text-[0.75rem] font-semibold text-foreground">
                <span className="mr-1 tabular-nums text-muted-foreground">{i + 1}.</span>
                {s.name}
              </p>
              <p className="mt-1 text-[0.6875rem] leading-snug text-muted-foreground">
                {s.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </DiagramShell>
  );
}
