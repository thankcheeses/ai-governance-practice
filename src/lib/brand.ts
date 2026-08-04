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
 * The operating entity. The app is a product; NHID-Clinical is the company that
 * publishes it, contracts with users through the Terms, and answers support.
 * Legal pages and store listings name the company, not the product.
 */
export const COMPANY = {
  name: "NHID-Clinical",
  descriptor: "an AI governance and security platform",
  email: "contact@nhid-clinical.org",
} as const;

/**
 * Support contact. Both app stores require a reachable support channel on the
 * listing and expect one in the app. Single source so there is one line to
 * change if it ever moves.
 */
export const SUPPORT = {
  email: COMPANY.email,
} as const;

/**
 * Bumped whenever the substance of the Terms or Privacy Policy changes, not on
 * copy-editing passes. Shown on both documents so a user can tell which version
 * they agreed to.
 */
export const LEGAL_EFFECTIVE_DATE = "4 August 2026";

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
