/**
 * Brand and legal copy.
 *
 * Single source so the disclaimer is identical everywhere it appears (first
 * launch and Settings) and can never drift.
 *
 * Positioning is locked: Judgment Labs is AI governance scenario training for
 * practitioners. AIGP Preparation is the current track — an acquisition wedge,
 * not the category. Copy must never promise exam outcomes, claim official
 * status, or position the product as a certification replacement.
 */

export const BRAND = {
  name: "Judgment Labs",
  tagline: "AI Governance Practice for Practitioners",
  category: "AI governance scenario training built for practitioners.",
  positioning:
    "Judgment Labs helps professionals build practical AI governance judgment through original scenario-based learning.",
  /** Short lines approved for headings and CTAs. */
  lines: {
    build: "Build judgment through realistic governance scenarios.",
    apply:
      "Practice applying AI governance frameworks to real-world decisions.",
  },
} as const;

/**
 * Support contact. Both app stores require a reachable support channel on the
 * listing and expect one in the app.
 *
 * PLACEHOLDER — replace with a real, monitored address before submission. The
 * value is centralised so there is exactly one line to change.
 */
export const SUPPORT = {
  email: "support@judgmentlabs.example",
  /** True once the address above is real and monitored. */
  configured: false,
} as const;

export const DISCLAIMER_TITLE = "Independent Educational Product";

export const DISCLAIMER_BODY = [
  "Judgment Labs provides original educational content for professional development in AI governance.",
  "This product is not affiliated with, endorsed by, sponsored by, or connected to the International Association of Privacy Professionals (IAPP), CompTIA, Cloud Security Alliance, or any certification body.",
  "This product does not contain actual certification exam questions and does not guarantee exam success.",
  "All questions and scenarios are original educational material.",
] as const;

export const ONBOARDING_WELCOME =
  "Build practical AI governance judgment through realistic scenarios.";

export const ONBOARDING_POINTS = [
  {
    title: "Practitioner scenarios",
    body: "Most items put you inside a governance situation with a decision attached — a vendor deploying a voice agent, a model drifting in production — rather than asking you to recall a definition.",
  },
  {
    title: "Framework-based reasoning",
    body: "Every scenario maps to the frameworks practitioners work with: NIST AI RMF, the EU AI Act, ISO 42001, and responsible AI practice. You learn where an obligation comes from, not just that it exists.",
  },
  {
    title: "Mental models you reuse",
    body: "Each answer ends in a key takeaway — the underlying principle stated so it transfers to the next situation you have not seen before.",
  },
] as const;
