"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DiagramShell, FlowArrow, RAISED } from "./primitives";

/**
 * Accountability along a vendor chain.
 *
 * The shape is linear (org → vendor → subprocessor → data source) because the
 * teaching point is transfer of duty and the contractual levers that keep
 * accountability from evaporating. Selecting a node reveals the duty and the
 * lever that enforces it.
 */

const NODES = [
  {
    id: "org",
    label: "Your organization",
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
    <DiagramShell
      title="Vendor accountability chain"
      description="Duty does not disappear when work is outsourced. Select a node to see the residual duty and the contractual lever that enforces it."
      className={className}
    >
      <div
        role="toolbar"
        aria-label="Vendor chain nodes"
        className="flex flex-wrap items-center justify-center gap-1"
      >
        {NODES.map((n, i) => (
          <span key={n.id} className="inline-flex items-center gap-1">
            {i > 0 ? <FlowArrow /> : null}
            <button
              type="button"
              onClick={() => setActive(n.id)}
              aria-current={active === n.id ? "true" : undefined}
              className={cn(
                "min-h-9 rounded-lg border px-3 py-1.5 text-left text-[0.75rem] font-medium transition-colors duration-[120ms]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active === n.id
                  ? "border-accent bg-accent-tint text-accent-foreground ring-1 ring-inset ring-accent"
                  : "border-border bg-secondary text-muted-foreground hover:border-border-strong hover:text-foreground",
                RAISED,
              )}
            >
              {n.label}
            </button>
          </span>
        ))}
      </div>

      <div
        className={cn(
          "mt-4 rounded-lg border border-border bg-background/70 p-4",
          RAISED,
        )}
      >
        <p className="text-[0.8125rem] font-semibold text-foreground">
          {node.label}
        </p>
        <p className="mt-0.5 text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
          {node.role}
        </p>
        <dl className="mt-3 space-y-2 text-[0.75rem] leading-snug">
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
    </DiagramShell>
  );
}
