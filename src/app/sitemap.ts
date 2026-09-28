import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/base-path";

/**
 * The pages worth finding from a search engine.
 *
 * Four, not nineteen. The app routes are excluded here for the same reason
 * `robots.ts` disallows them: they render an empty shell to anyone without
 * local progress, so listing them would be advertising pages that say nothing.
 * A sitemap is a claim that these URLs are worth a crawl, and it is a stronger
 * claim when it is short.
 *
 * `SITE_URL` already carries the repository segment, so these are absolute and
 * correct on a project site without any further prefixing.
 *
 * No `lastModified`. A build timestamp would say every page changed whenever
 * the app was rebuilt, which is false for `/privacy` and `/terms` and would
 * teach a crawler to distrust the field. Omitted until there is a real
 * per-page modification date to put in it.
 */
/*
  Required under `output: "export"`. These routes read NEXT_PUBLIC_SITE_URL,
  which Next treats as a dynamic input, so without this it refuses to
  pre-render them and the whole static build fails. The value is inlined at
  build time, so "force-static" is accurate rather than a workaround.
*/
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/help`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
