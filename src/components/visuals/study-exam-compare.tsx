import { cn } from "@/lib/utils";
import { DiagramFrame } from "./primitives";

const STUDY = [
  "Immediate feedback after every answer",
  "Rationale and near-miss explanation",
  "Key takeaway to carry forward",
  "Wrong items enter the review queue",
  "Self-paced; pause and resume",
] as const;

const EXAM = [
  "No feedback until you submit",
  "Timed sitting under constraint",
  "Final score only",
  "Does not write to the review queue",
  "Designed to feel like the real sitting",
] as const;

export function StudyExamCompare({ className }: { className?: string }) {
  return (
    <DiagramFrame
      title="Two modes, one bank"
      lede="Study trains the reasoning loop. Exam tests whether the reasoning holds under constraint."
      className={className}
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <ModeColumn label="Study" intent="Learn the reasoning" items={STUDY} tone="study" />
        <ModeColumn label="Exam" intent="Test the reasoning" items={EXAM} tone="exam" />
      </div>
    </DiagramFrame>
  );
}

function ModeColumn({
  label,
  intent,
  items,
  tone,
}: {
  label: string;
  intent: string;
  items: readonly string[];
  tone: "study" | "exam";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-5 py-5",
        tone === "study"
          ? "border-border bg-background/70"
          : "border-border-strong/30 bg-secondary/40",
      )}
    >
      <p className="font-serif text-[1.125rem] text-foreground">{label}</p>
      <p className="mt-1 text-[0.8125rem] font-medium tracking-wide text-muted-foreground">
        {intent}
      </p>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[0.8125rem] leading-snug text-foreground/90">
            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-border-strong" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
