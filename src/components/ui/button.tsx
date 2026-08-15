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
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[0.9375rem] font-medium",
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
          "bg-primary text-primary-foreground shadow-[var(--shadow-raised)] hover:bg-primary-strong",
        secondary:
          "border border-border bg-secondary text-secondary-foreground hover:border-border-strong hover:bg-muted",
        outline:
          "border border-border-strong bg-card text-foreground shadow-[var(--shadow-raised)] hover:bg-secondary",
        ghost: "hover:bg-secondary hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow-raised)] hover:opacity-90",
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
