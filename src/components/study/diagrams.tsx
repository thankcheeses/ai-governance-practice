import type { DiagramName } from "@/content/types";

/**
 * Teaching diagrams, drawn inline.
 *
 * Why inline rather than an asset: a figure loaded through `next/image` is an
 * image, and an image cannot inherit `currentColor`. These are stroked in the
 * text colour of the surface they land on, so one definition reads correctly in
 * both themes — README "Visual language" rule 2. It also means a diagram cannot
 * 404, which matters for a figure that is carrying part of the explanation.
 *
 * Rule 4 applies to everything in this file: a diagram that makes a claim is
 * content, and carries the same sourcing as the prose. Every label below is
 * taken from an article this repository already cites in a track's
 * `enrichment.ts` — not from recall. If a label cannot be traced to a citation
 * in the content, it does not belong in the drawing.
 *
 * Text inside an SVG does not reflow, so each diagram is drawn to read at the
 * 180px / 240px frame `VisualAid` caps it to, and the `alt` on the content
 * entry carries the whole argument for anyone who cannot see it.
 */

interface Tier {
  tier: string;
  /** The article this repository already cites for the tier. */
  rule: string;
  note: string;
  /** The rung the question turns on, drawn heavier. */
  emphasis?: boolean;
}

const TIERS: readonly Tier[] = [
  {
    tier: "Prohibited",
    rule: "Art. 5",
    note: "No route to market.",
    emphasis: true,
  },
  {
    tier: "High risk",
    rule: "Art. 6 → 43",
    note: "Conformity assessment first.",
  },
  {
    tier: "Limited risk",
    rule: "Art. 50",
    note: "Disclose at the point of interaction.",
  },
  {
    tier: "Minimal risk",
    rule: "—",
    note: "No obligation attaches.",
  },
];

/**
 * The EU AI Act risk ladder, read top down.
 *
 * Drawn for the point question 95 makes: the top tier is not "strictest
 * controls", it is the line past which no controls help, so prohibition is
 * checked first. The arrow runs downward and the first rung is the emphasised
 * one, which is the whole argument in one glance.
 */
function EuRiskLadder() {
  const rowH = 30;
  const top = 8;
  return (
    <svg
      viewBox="0 0 400 136"
      className="h-full w-full text-foreground"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* The descending check order. The arrow carries it; no label needed. */}
      <g stroke="currentColor" strokeOpacity={0.3} strokeWidth={1}>
        <path d="M7 10v110" />
        <path d="M4 116l3 5 3-5" fill="currentColor" fillOpacity={0.3} stroke="none" />
      </g>

      {TIERS.map((t, i) => {
        const y = top + i * rowH;
        return (
          <g key={t.tier}>
            <rect
              x={18}
              y={y}
              width={378}
              height={24}
              rx={4}
              stroke="currentColor"
              strokeOpacity={t.emphasis ? 0.85 : 0.22}
              strokeWidth={t.emphasis ? 1.4 : 1}
              fill="currentColor"
              fillOpacity={t.emphasis ? 0.07 : 0}
            />
            <text
              x={28}
              y={y + 15}
              className="fill-current text-[9px] font-semibold"
              fillOpacity={t.emphasis ? 1 : 0.75}
            >
              {t.tier}
            </text>
            <text
              x={128}
              y={y + 15}
              className="fill-current font-mono text-[8px]"
              fillOpacity={0.55}
            >
              {t.rule}
            </text>
            <text
              x={218}
              y={y + 15}
              className="fill-current text-[8px]"
              fillOpacity={0.6}
            >
              {t.note}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Where a disclosure lands in the interaction, for question 19.
 *
 * The question turns on timing, not presence: a disclosure delivered after the
 * member has already shared is not a weaker control, it is one informing a
 * choice that has been made. A sequence is the only shape that shows that, so
 * the same badge is drawn twice on one line and only its position changes.
 */
function DisclosureTiming() {
  const line = 78;
  const steps = [
    { x: 62, label: "Point of interaction" },
    { x: 200, label: "Member shares PHI" },
    { x: 338, label: "Decision made" },
  ];
  return (
    <svg
      viewBox="0 0 400 136"
      className="h-full w-full text-foreground"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="currentColor" strokeOpacity={0.3} strokeWidth={1}>
        <path d="M20 78h360" />
        <path d="M376 74l5 4-5 4" fill="currentColor" fillOpacity={0.3} stroke="none" />
      </g>

      {steps.map((s) => (
        <g key={s.label}>
          <circle cx={s.x} cy={line} r={3.5} fill="currentColor" fillOpacity={0.45} />
          <text
            x={s.x}
            y={line + 17}
            textAnchor="middle"
            className="fill-current text-[7.5px]"
            fillOpacity={0.6}
          >
            {s.label}
          </text>
        </g>
      ))}

      {/* In time: the member can still act on what they were told. */}
      <g>
        <rect
          x={16}
          y={26}
          width={92}
          height={22}
          rx={4}
          stroke="currentColor"
          strokeOpacity={0.85}
          strokeWidth={1.4}
          fill="currentColor"
          fillOpacity={0.07}
        />
        <text x={62} y={40} textAnchor="middle" className="fill-current text-[8px] font-semibold">
          Disclosure
        </text>
        <path d="M62 48v24" stroke="currentColor" strokeOpacity={0.55} strokeWidth={1} />
        <text x={62} y={20} textAnchor="middle" className="fill-current text-[7px]" fillOpacity={0.65}>
          still a choice
        </text>
      </g>

      {/* Too late: the same words, after the fact. */}
      <g>
        <rect
          x={292}
          y={26}
          width={92}
          height={22}
          rx={4}
          stroke="currentColor"
          strokeOpacity={0.28}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text x={338} y={40} textAnchor="middle" className="fill-current text-[8px]" fillOpacity={0.55}>
          Disclosure
        </text>
        <path
          d="M338 48v24"
          stroke="currentColor"
          strokeOpacity={0.28}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text x={338} y={20} textAnchor="middle" className="fill-current text-[7px]" fillOpacity={0.5}>
          nothing left to decide
        </text>
      </g>
    </svg>
  );
}

const DIAGRAMS: Record<DiagramName, () => React.JSX.Element> = {
  "eu-risk-ladder": EuRiskLadder,
  "disclosure-timing": DisclosureTiming,
};

export function Diagram({ name }: { name: DiagramName }) {
  const Figure = DIAGRAMS[name];
  return Figure ? <Figure /> : null;
}

export function hasDiagram(name: string): name is DiagramName {
  return name in DIAGRAMS;
}
