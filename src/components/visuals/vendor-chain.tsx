"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DiagramFrame, FlowRule } from "./primitives";

/**
 * Accountability along a vendor chain.
 * Shape: linear transfer of work does not transfer residual duty.
 */

const NODES = [
  {
    id: "org",
    label: "Your organisation",
    role: "Deployer / controller",
    duty: "Remains accountable for outcomes even when work is outsourced. Must know who is in the chain and what data moves.",
    lever: "Internal policy + board/executive ownership of AI risk",
  },
  {
    id: "vendor",
    label: "AI vendor",
    role: "Provider / processor",
    duty: "Delivers the model or service under contractual terms. Must disclose material limitations, subprocessors, and incident notice windows.",
    lever: "Master agreement, DPA / BAA, audit rights, termination for cause",
  },
  {
    id: "sub",
    label: "Subprocessor",
    role: "Downstream processor",
    duty: "Handles data or inference on the vendor's behalf. Cannot invent new purposes. Must meet the same security and privacy bar.",
    lever: "Flow-down clauses, subprocessor lists, right to object",
  },
  {
    id: "source",
    label: "Data source",
    role: "Origin of training / inference data",
    duty: "Lawful basis, purpose limitation, and quality commitments sit at the source. Poor provenance becomes everyone else's risk.",
    lever: "Data use agreements, provenance attestations, quality SLAs",
  },
] as const;

export function VendorChain({ className }: { className?: string }) {
  const [active, setActive] = useState<string>("org");
  const node = NODES.find((n) => n.id === active) ?? NODES[0];

  return (
    <DiagramFrame
      title="Vendor accountability chain"
      lede="Duty does not disappear when work is outsourced. Select a node to see residual duty and the contractual lever that enforces it."
      className={className}
    >
      <ol className="mx-auto flex max-w-sm flex-col items-stretch">
        {NODES.map((n, i) => (
          <li key={n.id} className="flex flex-col items-center">
            {i > 0 ? <FlowRule /> : null}
            <button
              type="button"
              onClick={() => setActive(n.id)}
              aria-current={active === n.id ? "true" : undefined}
              className={cn(
                "w-full rounded-xl border px-4 py-3.5 text-left transition-colors duration-[120ms]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active === n.id
                  ? "border-primary bg-primary/[0.04] ring-1 ring-inset ring-primary/30"
                  : "border-border bg-background/80 hover:border-border-strong",
              )}
            >
              <p className="text-[0.875rem] font-semibold text-foreground">{n.label}</p>
              <p className="mt-0.5 text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
                {n.role}
              </p>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-5 border-t border-border/70 pt-5">
        <p className="font-serif text-[1.0625rem] text-foreground">{node.label}</p>
        <dl className="mt-3 space-y-3 text-[0.8125rem] leading-snug">
          <div>
            <dt className="font-medium text-foreground">Residual duty</dt>
            <dd className="mt-0.5 text-muted-foreground">{node.duty}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Contractual lever</dt>
            <dd className="mt-0.5 text-muted-foreground">{node.lever}</dd>
          </div>
        </dl>
      </div>
    </DiagramFrame>
  );
}
