/**
 * Brand and legal copy, kept in one module so the disclaimer text is identical
 * everywhere it appears (first launch and Settings) and can never drift.
 */

export const BRAND = {
  name: "Judgment Labs",
  tagline: "AI Governance Practice for Practitioners",
  positioning:
    "Judgment Labs helps professionals build practical AI governance judgment through original scenario-based learning.",
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
    title: "Original practice questions",
    body: "Every question and scenario is original educational material written for this platform. Nothing here is drawn from any certification exam.",
  },
  {
    title: "Framework-based learning",
    body: "Items map to the frameworks practitioners actually work with — NIST AI RMF, the EU AI Act, ISO 42001, and responsible AI practice — so you learn where an obligation comes from.",
  },
  {
    title: "Scenario-driven training",
    body: "Most questions put you in a situation with a decision attached rather than asking for a definition. The goal is judgment you can reuse, not recall.",
  },
] as const;
