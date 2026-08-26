import { cn } from "@/lib/utils";
import { DiagramFrame, FlowRule } from "./primitives";

/**
 * Practice loop as a vertical cycle.
 * Shape carries the argument: scenario → decide → feedback → carry forward → next.
 * Progressive entrance (CSS only) helps learners see sequence; disabled under
 * prefers-reduced-motion.
 */

const STEPS = [
  { name: "Scenario", detail: "Read the facts without jumping to a framework." },
  { name: "Decide", detail: "Choose the narrowest defensible next step." },
  { name: "Feedback", detail: "See why — including the near-miss distractors." },
  { name: "Carry forward", detail: "The key takeaway becomes the portable rule." },
] as const;

export function LearningLoop({ className }: { className?: string }) {
  return (
    <DiagramFrame
      title="How a scenario trains judgment"
      lede="Vocabulary is necessary. The loop is what turns it into practice."
      className={className}
    >
      <ol className="mx-auto flex max-w-md flex-col items-stretch">
        {STEPS.map((s, i) => (
          <li
            key={s.name}
            className={cn(
              "flex flex-col items-center",
              "motion-safe:animate-[loop-step-in_420ms_ease-out_both]",
            )}
            style={
              {
                animationDelay: `${i * 90}ms`,
              } as React.CSSProperties
            }
          >
            {i > 0 ? <FlowRule /> : null}
            <div
              className={cn(
                "w-full rounded-xl border border-border bg-background/80 px-5 py-4",
                "shadow-[0_1px_2px_rgb(15_23_42/0.04)]",
              )}
            >
              <p className="flex items-baseline gap-2.5">
                <span className="font-serif text-[1.125rem] tabular-nums text-muted-foreground/70">
                  {i + 1}
                </span>
                <span className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
                  {s.name}
                </span>
              </p>
              <p className="mt-1.5 pl-7 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {s.detail}
              </p>
            </div>
          </li>
        ))}
        <li
          className="mt-1 flex flex-col items-center motion-safe:animate-[loop-step-in_420ms_ease-out_both]"
          style={{ animationDelay: `${STEPS.length * 90}ms` } as React.CSSProperties}
          aria-hidden
        >
          <FlowRule className="h-4" />
          <div className="flex items-center gap-2 text-[0.75rem] font-medium tracking-wide text-muted-foreground">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M4 12a8 8 0 0 1 14.5-4.8M20 12a8 8 0 0 1-14.5 4.8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M17 4.5v3.5h3.5M7 19.5v-3.5H3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>into the next scenario</span>
          </div>
        </li>
      </ol>
    </DiagramFrame>
  );
}
