import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * A label: bordered, tinted, and set apart from prose by size and a soft
 * capsule rather than by shouting.
 *
 * An earlier revision set these in 11px letter-spaced uppercase. That scans as
 * metadata, but badges here also carry framework names — "NIST AI RMF",
 * "ISO/IEC 42001" — which a learner needs to *read*, and uppercasing an
 * acronym-laden string at 11px makes it a texture. Sentence case at 12px keeps
 * the label role without costing legibility.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-border-strong bg-accent-tint text-accent-foreground",
        secondary: "border-border bg-secondary text-secondary-foreground",
        outline: "border-border bg-card text-muted-foreground",
        success: "border-success bg-success-tint text-success",
        warning: "border-warning bg-warning/15 text-warning",
        destructive: "border-destructive bg-destructive-tint text-destructive",
        onDark: "border-white/40 bg-transparent text-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
