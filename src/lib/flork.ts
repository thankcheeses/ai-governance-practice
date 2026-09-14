/**
 * The FLORK illustration catalogue.
 *
 * Plain data, deliberately separate from the component that renders it
 * (`src/components/app/flork-art.tsx`), so the asset list can be tested in node
 * without pulling in React, `next/image` or a client boundary. The test that
 * matters is in `flork.test.ts`: it checks every file is present and still
 * byte-identical to what was supplied.
 *
 * Provenance, licensing and the no-affiliation statement live in
 * `public/flork/README.md` and `docs/flork-licensing.md`.
 */

export type FlorkName =
  | "overwhelmedEquations"
  | "reading"
  | "idea"
  | "goStudy"
  | "content"
  | "confused"
  | "overwhelmedBlur"
  | "slay"
  | "unimpressed"
  | "okSign"
  | "grinningPointing"
  | "thumbsUp";

export interface FlorkAsset {
  /** Path under /public, before any base path is applied. */
  src: string;
  /** Intrinsic pixel size, so the layout reserves the right box up front. */
  width: number;
  height: number;
  /**
   * Alt text. Two of the twelve have English words drawn into the pixels; those
   * words are repeated here, because a screen reader cannot read baked-in text
   * and a learner who cannot see the image would otherwise miss the line.
   */
  alt: string;
}

/**
 * The twelve supplied files.
 *
 * Keyed by intent rather than by filename, so a placement reads as a mood and
 * the mapping stays reviewable in one place. The files are named for what they
 * show — the upload names (`12e1c135-image.jpg`) carry no meaning for a future
 * reader — and the README records which upload each one came from.
 */
export const FLORK: Record<FlorkName, FlorkAsset> = {
  overwhelmedEquations: {
    src: "/flork/overwhelmed-equations.jpg",
    width: 736,
    height: 736,
    alt: "A blobby cartoon character raising both arms, surrounded by dense handwritten equations.",
  },
  reading: {
    src: "/flork/reading.jpg",
    width: 736,
    height: 736,
    alt: "A blobby cartoon character wearing glasses, reading an open book.",
  },
  idea: {
    src: "/flork/idea.jpg",
    width: 720,
    height: 703,
    alt: "A blobby cartoon character with a lightbulb glowing above its head.",
  },
  goStudy: {
    src: "/flork/go-study.jpg",
    width: 736,
    height: 1308,
    alt: 'A blobby cartoon character standing with a hand on its hip, pointing upward. Text above reads "GO STUDY!"',
  },
  content: {
    src: "/flork/content.jpg",
    width: 512,
    height: 512,
    alt: "A blobby cartoon character with closed eyes and a calm expression, one arm raised.",
  },
  confused: {
    src: "/flork/confused.jpg",
    width: 512,
    height: 512,
    alt: "A blobby cartoon character shrugging with both palms up and question marks beside its head.",
  },
  overwhelmedBlur: {
    src: "/flork/overwhelmed-blur.jpg",
    width: 345,
    height: 345,
    alt: "A blobby cartoon character against a blurred swirl of equations and formulas.",
  },
  slay: {
    src: "/flork/slay.jpg",
    width: 720,
    height: 717,
    alt: 'A blobby cartoon character posing confidently with one arm raised. Text above reads "slaaaaaaay"',
  },
  unimpressed: {
    src: "/flork/unimpressed.jpg",
    width: 512,
    height: 512,
    alt: "A blobby cartoon character with a raised eyebrow and both hands on its hips, looking unimpressed.",
  },
  okSign: {
    src: "/flork/ok-sign.jpg",
    width: 720,
    height: 710,
    alt: "A blobby cartoon character making an OK hand sign.",
  },
  grinningPointing: {
    src: "/flork/grinning-pointing.jpg",
    width: 696,
    height: 568,
    alt: "A blobby cartoon character grinning widely and pointing with both hands.",
  },
  thumbsUp: {
    src: "/flork/thumbs-up.jpg",
    width: 736,
    height: 736,
    alt: "A blobby cartoon character giving a double thumbs up.",
  },
};
