"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * The Civic control: a tactile surface with a soft raised shadow and a 1px
 * translate on press, so it reads as depressed rather than scaled. No glows,
 * no gradients.
 *
 * Every size clears the 44px minimum touch target the design system requires —
 * including `sm`, which exists to look lighter rather than to be smaller than
 * a finger. The old 36/40px heights failed that rule on every surface they
 * appeared on.
 *
 * ## Disabled is a surface, not an opacity
 *
 * The blanket `disabled:opacity-50` still applies to every variant, but the
 * filled ones opt out of it, because fading a filled control is the one case
 * where it goes wrong twice over.
 *
 * Measured: `--primary` is `#1a2332` and `--primary-foreground` is `#fffbf6`.
 * At 50% over the `#f4ede4` page, the surface lands on a dead mid-gray and the
 * label on it falls to roughly 1.9:1 — far under the 4.5:1 floor. The case
 * that found it was the study screen's submit button, whose disabled label was
 * the one instruction telling the learner how to proceed and the least
 * readable text on the page. That button is gone — answers now commit on the
 * choosing tap — but the contrast rule is not about one label, and every
 * filled control that can be disabled still depends on it.
 *
 * Filled variants therefore drop to the `secondary` surface with
 * `muted-foreground` text at full opacity. Measured in the browser on the
 * study screen: 6.09:1 in light, 6.46:1 in dark — both clear of AA, up from
 * roughly 1.9:1. The ring is `ring-inset` rather than a border so the control
 * does not change size when it becomes enabled.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[0.9375rem] font-medium",
    "transition-all duration-[120ms] focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-px",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-raised)] hover:bg-primary-strong " +
          "disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none disabled:ring-1 disabled:ring-inset disabled:ring-border",
        secondary:
          "border border-border bg-secondary text-secondary-foreground hover:border-border-strong hover:bg-muted",
        outline:
          "border border-border-strong bg-card text-foreground shadow-[var(--shadow-raised)] hover:bg-secondary",
        ghost: "hover:bg-secondary hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow-raised)] hover:opacity-90 " +
          "disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none disabled:ring-1 disabled:ring-inset disabled:ring-border",
        link: "text-link underline decoration-link/40 underline-offset-4 hover:text-link-hover hover:decoration-link-hover",
      },
      size: {
        default: "min-h-11 px-5 py-2",
        sm: "min-h-11 px-4 text-[0.875rem]",
        lg: "min-h-[3.25rem] px-7 text-[1rem]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
