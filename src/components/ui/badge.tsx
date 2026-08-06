import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * A label, in the industrial sense: rectangular, bordered, uppercase, and
 * letter-spaced so it scans as metadata rather than as prose.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-none border px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.06em] transition-colors",
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
