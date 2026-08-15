"use client";

import { cn } from "@/lib/utils";

/**
 * Friction against lifting a question straight into a chatbot.
 *
 * ## What this is, and what it is not
 *
 * It is a speed bump. The text has to be in the DOM to be rendered, so
 * screenshots, OCR, view-source, devtools and simply retyping all still work,
 * and nothing here should be described as protection. What it stops is the
 * frictionless case — select, copy, paste — which is the overwhelming majority
 * of it, because someone willing to open devtools was never going to be
 * stopped by anything short of not sending them the question.
 *
 * ## Why only the question
 *
 * This wraps the stem and the answer options. It deliberately does **not**
 * wrap the rationale, the key takeaway, or the distractor notes.
 *
 * Those are the part with learning value rather than cheating value: they only
 * appear once the answer is already revealed, so copying them gives away
 * nothing, and a learner who wants to paste a takeaway into their own notes is
 * doing exactly what the product is for. Locking the material that teaches
 * would be friction pointed at the wrong person.
 *
 * ## Accessibility
 *
 * `user-select: none` does not affect screen readers — they read the
 * accessibility tree, not the selection — so the text is still announced
 * normally, and browser translation still operates on the DOM. What it does
 * cost is sighted selection-while-reading, which some people rely on to hold
 * their place. That is a real cost, accepted deliberately and confined to the
 * two elements above so it never touches an explanation, a control, or a
 * label.
 */
export function ProtectedText({
  as: Tag = "div",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "span" | "p" | "h1" | "h2";
}) {
  return (
    <Tag
      className={cn("select-none [-webkit-touch-callout:none]", className)}
      /*
        Belt and braces. `user-select: none` already prevents a drag-select,
        but Ctrl+A reaches everything on the page and a right-click menu offers
        copy regardless, so the copy itself is intercepted too. Returning an
        empty clipboard rather than silently allowing it is what makes the
        result obvious instead of mysterious.
      */
      onCopy={swallow}
      onCut={swallow}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      {...props}
    >
      {children}
    </Tag>
  );
}

function swallow(event: React.ClipboardEvent) {
  event.preventDefault();
  event.clipboardData.setData(
    "text/plain",
    "Questions in AI Governance Practice are not copyable. " +
      "Work the decision — the rationale afterwards is yours to keep.",
  );
}
