"use client";

import { useState } from "react";

const PASSES = [
  {
    id: "facts",
    title: "Facts",
    body: "What is actually described — the system, who it affects, what stage it is at. Separate this from what you assume.",
  },
  {
    id: "obligations",
    title: "Obligations",
    body: "What is required here, and by whom. Duties attach to roles and contexts.",
  },
  {
    id: "risks",
    title: "Risks",
    body: "What could go wrong for the people on the receiving end, ranked by how badly rather than how likely.",
  },
  {
    id: "action",
    title: "Action",
    body: "The narrowest step that addresses that risk. Name the trade-off.",
  },
] as const;

/** Checklist a learner can tick while reading the current scenario. */
export function ReadCoach({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  return (
    <div className="mb-5">
      <button
        type="button"
        className="text-[0.8125rem] font-medium text-link underline decoration-link/40 underline-offset-4 hover:text-link-hover"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide how to read this" : "How to read this"}
      </button>
      {open ? (
        <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-[0.75rem] text-muted-foreground">
            Work top to bottom. This list is only for you — it is not scored.
          </p>
          <ul className="mt-3 space-y-3">
            {PASSES.map((pass) => {
              const id = `${questionId}-${pass.id}`;
              return (
                <li key={pass.id}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[var(--accent)]"
                      checked={Boolean(checked[id])}
                      onChange={() =>
                        setChecked((c) => ({ ...c, [id]: !c[id] }))
                      }
                    />
                    <span>
                      <span className="font-serif text-[1rem]">{pass.title}</span>
                      <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-muted-foreground">
                        {pass.body}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
