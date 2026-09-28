import type { Metadata } from "next";
import { withBasePath } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/**
 * 404.
 *
 * On both static export targets Next writes this out as `404.html`, which is
 * the file GitHub Pages serves for any path it cannot match — so this is what
 * a stale bookmark or a mistyped URL actually lands on. Without it the host's
 * own default page appeared instead: unstyled, unbranded, and with no route
 * back into the app.
 *
 * Links are plain anchors carrying the base path by hand. A project site is
 * served from `/<repo>/`, and `next/link` only rewrites hrefs it is given
 * through the router — a bare "/" here would leave the repository segment off
 * and 404 a second time.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        404
      </p>
      <h1 className="text-[1.875rem] leading-[1.15]">This page does not exist</h1>
      <p className="measure mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
        The address may be out of date, or the page may have moved. Your saved
        progress is stored on this device and is unaffected.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={withBasePath("/study")}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground no-underline transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Go to practice
        </a>
        <a
          href={withBasePath("/")}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Back to start
        </a>
      </div>
    </main>
  );
}
