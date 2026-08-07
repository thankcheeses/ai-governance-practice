import { Info } from "lucide-react";
import { DISCLAIMER_BODY, DISCLAIMER_TITLE } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * The single source of the disclaimer, rendered identically on first launch and
 * in Settings. Copy lives in lib/brand so the two can never drift.
 */
export function Disclaimer({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "border border-border bg-card p-4 sm:p-5",
        className,
      )}
      aria-labelledby="disclaimer-title"
    >
      <h2
        id="disclaimer-title"
        className="flex items-center gap-2 text-sm font-semibold"
      >
        <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
        {DISCLAIMER_TITLE}
      </h2>
      <div
        className={cn(
          "mt-3 space-y-2.5 leading-relaxed text-muted-foreground",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {DISCLAIMER_BODY.map((paragraph) => (
          <p key={paragraph} className="measure">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
